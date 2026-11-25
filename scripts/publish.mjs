// Publishes the production build on this computer through a free Cloudflare quick tunnel.
// Used by publicar-sisapa.bat (after `pnpm build`), or manually: pnpm publicar
//
// 1. makes sure .env has a JWT_SECRET (generated once, never printed)
// 2. backs up the database and uploads (scripts/backup.mjs)
// 3. starts the server (dist/server/node-build.mjs) and waits for /api/health
// 4. starts `cloudflared tunnel --url http://localhost:PORT` and shows the public link
// Ctrl+C (or closing the window) stops both.
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseEnv, setEnvValues } from "./configure-email.mjs";
import { backup } from "./backup.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(ROOT, ".env");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");
const SERVER_ENTRY = path.join(ROOT, "dist", "server", "node-build.mjs");

// Where `winget install Cloudflare.cloudflared` puts the binary (PATH only updates in new terminals)
const CLOUDFLARED_CANDIDATES = [
  "cloudflared",
  "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
  "C:\\Program Files\\cloudflared\\cloudflared.exe",
];

// ── Pure helpers (unit tested in publish.spec.mjs) ──

/** Returns the .env content with a random JWT_SECRET when it is missing or empty. */
export function ensureJwtSecret(content, randomHex = () => crypto.randomBytes(32).toString("hex")) {
  if (parseEnv(content).JWT_SECRET) return { content, created: false };
  return { content: setEnvValues(content, { JWT_SECRET: randomHex() }), created: true };
}

/** Finds the public quick-tunnel address in cloudflared's log output. */
export function extractTunnelUrl(text) {
  return text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i)?.[0] ?? null;
}

// ── Runtime ──

function findCloudflared() {
  for (const candidate of CLOUDFLARED_CANDIDATES) {
    const result = spawnSync(candidate, ["--version"], { stdio: "ignore", windowsHide: true });
    if (result.status === 0) return candidate;
  }
  return null;
}

async function waitForHealth(port, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.ok) return true;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function copyToClipboard(text) {
  if (process.platform !== "win32") return false;
  const result = spawnSync("clip", { input: text, windowsHide: true });
  return result.status === 0;
}

function banner(lines) {
  const width = Math.max(...lines.map((l) => l.length)) + 4;
  console.log("");
  console.log("=".repeat(width));
  for (const line of lines) console.log(`  ${line}`);
  console.log("=".repeat(width));
  console.log("");
}

async function main() {
  if (!fs.existsSync(SERVER_ENTRY)) {
    console.error("Build não encontrado. Rode 'pnpm build' antes (o publicar-sisapa.bat já faz isso).");
    process.exit(1);
  }

  const cloudflared = findCloudflared();
  if (!cloudflared) {
    console.error("cloudflared não encontrado. Instale com:");
    console.error("  winget install --id Cloudflare.cloudflared");
    console.error("Depois feche e abra esta janela de novo.");
    process.exit(1);
  }

  // 1. JWT secret (kept in .env so logins survive restarts)
  if (!fs.existsSync(ENV_PATH)) fs.copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
  const secret = ensureJwtSecret(fs.readFileSync(ENV_PATH, "utf8"));
  if (secret.created) {
    fs.writeFileSync(ENV_PATH, secret.content, "utf8");
    console.log("JWT_SECRET gerado e salvo no .env deste computador.");
  }
  // dotenv already loaded .env into process.env (real environment variables win);
  // only the secret generated just now is missing from it
  const env = { ...process.env };
  if (!env.JWT_SECRET) env.JWT_SECRET = parseEnv(secret.content).JWT_SECRET;
  const port = Number(env.PORT) || 3000;

  // 2. Backup before starting (state as it was when the server last stopped)
  const saved = await backup();
  if (saved) console.log(`Backup salvo em ${path.relative(ROOT, saved)}`);

  // 3. Server
  console.log(`Iniciando o SISAPA na porta ${port}...`);
  const server = spawn(process.execPath, [SERVER_ENTRY], { cwd: ROOT, env, stdio: "inherit" });
  const children = [server];
  let stopping = false;
  const stopAll = (code = 0) => {
    if (stopping) return;
    stopping = true;
    for (const child of children) if (child.exitCode === null) child.kill();
    process.exit(code);
  };
  process.on("SIGINT", () => stopAll(0));
  process.on("SIGTERM", () => stopAll(0));
  server.on("exit", (code) => {
    if (!stopping) console.error(`\nO servidor parou (código ${code}). Encerrando o túnel.`);
    stopAll(code ?? 1);
  });

  if (!(await waitForHealth(port))) {
    console.error(`O servidor não respondeu em http://localhost:${port}. Veja as mensagens acima.`);
    console.error(`Se a porta ${port} já estiver em uso, feche o outro SISAPA ou mude PORT no .env.`);
    stopAll(1);
    return;
  }

  // 4. Tunnel
  console.log("Abrindo o túnel público (Cloudflare)...");
  const tunnel = spawn(cloudflared, ["tunnel", "--no-autoupdate", "--url", `http://localhost:${port}`], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  children.push(tunnel);

  let announced = false;
  let log = "";
  const onOutput = (chunk) => {
    if (announced) return;
    log += chunk.toString();
    const url = extractTunnelUrl(log);
    if (!url) return;
    announced = true;
    const lines = ["SISAPA NO AR", "", `Link público: ${url}`];
    if (copyToClipboard(url)) lines.push("(já copiado: é só colar e enviar)");
    lines.push(
      "",
      "O link muda toda vez que este programa é reiniciado.",
      "Mantenha o notebook ligado, conectado e esta janela aberta.",
      "Para tirar do ar: Ctrl+C ou feche esta janela.",
    );
    banner(lines);
  };
  tunnel.stdout.on("data", onOutput);
  tunnel.stderr.on("data", onOutput);

  setTimeout(() => {
    if (!announced) {
      console.error("O túnel ainda não informou o link. Últimas mensagens do cloudflared:");
      console.error(log.split(/\r?\n/).slice(-10).join("\n"));
    }
  }, 45_000).unref();

  tunnel.on("exit", (code) => {
    if (!stopping) console.error(`\nO túnel caiu (código ${code}). Encerrando o servidor; rode de novo para obter um novo link.`);
    stopAll(code ?? 1);
  });
}

// Run only when executed directly (not when imported by tests)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("Erro ao publicar:", err?.message ?? err);
    process.exit(1);
  });
}
