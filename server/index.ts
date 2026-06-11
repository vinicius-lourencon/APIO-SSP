import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { initDb } from "./db/database.js";
import authRouter from "./routes/auth.js";
import projectsRouter from "./routes/projects.js";
import evaluationsRouter from "./routes/evaluations.js";
import filesRouter from "./routes/files.js";
import notificationsRouter from "./routes/notifications.js";

export function createServer() {
  // Initialize database synchronously before any request is handled
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
        },
      },
    })
  );

  // ── CORS ──
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL || "https://your-domain.com"]
      : ["http://localhost:8080", "http://127.0.0.1:8080"];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Origem não permitida pelo CORS."));
        }
      },
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
  app.use("/api/avaliacoes", evaluationsRouter);
  app.use("/api/files", filesRouter);
  app.use("/api/notificacoes", notificationsRouter);

  // ── 404 for unmatched API routes ──
  app.use("/api/*path", (_req, res) => {
    res.status(404).json({ error: "Rota não encontrada." });
  });

  return app;
}
