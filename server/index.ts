import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { initDb } from "./db/database.js";
import { assertAuthConfig } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import projectsRouter from "./routes/projects.js";
import meetingsRouter from "./routes/meetings.js";
import evaluationsRouter from "./routes/evaluations.js";
import filesRouter from "./routes/files.js";
import notificationsRouter from "./routes/notifications.js";

const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

// Same-origin requests are always allowed (covers `pnpm start` on any port and LAN access);
// extra origins come from CORS_ORIGINS; local hostnames are allowed outside production.
function isAllowedOrigin(origin: string, host: string | undefined, extraOrigins: string[]): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (host && url.host === host) return true;
  if (extraOrigins.includes(origin)) return true;
  return process.env.NODE_ENV !== "production" && LOCAL_HOSTNAMES.includes(url.hostname);
}

export function createServer() {
  // Fail fast on missing configuration, then initialize the database before any request
  assertAuthConfig();
  initDb();

  const app = express();

  // ── Security Headers ──
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          // Local-only HTTP app: upgrading would break access by LAN IP (no HTTPS available)
          upgradeInsecureRequests: null,
        },
      },
    })
  );

  // ── CORS ──
  const extraOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !isAllowedOrigin(origin, req.headers.host, extraOrigins)) {
      res.status(403).json({ error: "Origem não permitida pelo CORS." });
      return;
    }
    next();
  });

  app.use(
    cors({
      origin: true, // only reached by allowed origins (checked above)
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // ── Rate Limiting ──
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  });

  app.use("/api", globalLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  // ── Request log (API only) ──
  app.use("/api", (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      console.log(`[api] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });

  // ── Body Parsers ──
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // ── Health Check ──
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── API Routes ──
  app.use("/api/auth", authRouter);
  app.use("/api/projetos", projectsRouter);
  app.use("/api/projetos", meetingsRouter);
  app.use("/api/avaliacoes", evaluationsRouter);
  app.use("/api/files", filesRouter);
  app.use("/api/notificacoes", notificationsRouter);

  // ── 404 for unmatched API routes ──
  app.use("/api/*path", (_req, res) => {
    res.status(404).json({ error: "Rota não encontrada." });
  });

  // ── Errors: always JSON, never an HTML stack trace ──
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);

    if (err?.type === "entity.parse.failed") {
      res.status(400).json({ error: "Corpo da requisição inválido (JSON malformado)." });
      return;
    }
    if (err?.type === "entity.too.large") {
      res.status(413).json({ error: "Corpo da requisição muito grande." });
      return;
    }

    const status = Number(err?.status ?? err?.statusCode) || 500;
    if (status >= 500) {
      console.error(`[erro] ${req.method} ${req.originalUrl}`, err);
    }
    res.status(status).json({ error: status >= 500 ? "Erro interno do servidor." : err.message });
  });

  return app;
}
