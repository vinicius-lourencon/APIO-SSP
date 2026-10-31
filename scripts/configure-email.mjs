// Interactive e-mail (Gmail SMTP) setup that writes ONLY to the local .env (never committed).
// Used by iniciar-sisapa.bat on the first run, or manually: pnpm email:config
//
//   node scripts/configure-email.mjs              -> (re)configure
//   node scripts/configure-email.mjs --if-missing -> only asks when SMTP_USER/SMTP_PASS are empty
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(ROOT, ".env");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");

const GMAIL_DEFAULTS = { SMTP_HOST: "smtp.gmail.com", SMTP_PORT: "465", SMTP_SECURE: "true" };

// ── Pure helpers (unit tested in configure-email.spec.mjs) ──

export function parseEnv(content) {
  const values = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return values;
}

export function isEmailConfigured(content) {
  const env = parseEnv(content);
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
}

/** Sets each key (replacing an existing "KEY=" line, or appending it), keeping every other line. */
export function setEnvValues(content, values) {
  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content === "" ? [] : content.split(/\r?\n/);
  for (const [key, value] of Object.entries(values)) {
    const index = lines.findIndex((line) => new RegExp(`^\\s*${key}\\s*=`).test(line));
    if (index >= 0) lines[index] = `${key}=${value}`;
    else {
      if (lines.length && lines[lines.length - 1] === "") lines.splice(lines.length - 1, 0, `${key}=${value}`);
      else lines.push(`${key}=${value}`);
    }
  }
  return lines.join(eol);
}

/** Values to write for a Gmail account; missing host/port defaults are filled in too. */
export function emailConfigValues(currentContent, { user, pass, redirectTo }) {
  const env = parseEnv(currentContent);
  const values = {};
  for (const [key, value] of Object.entries(GMAIL_DEFAULTS)) {
    if (!env[key]) values[key] = value;
  }
  values.SMTP_USER = user;
  values.SMTP_PASS = pass.replace(/\s+/g, ""); // Google shows app passwords as "abcd efgh ijkl mnop"
  values.MAIL_FROM = `SISAPA <${user}>`;
  values.EMAIL_REDIRECT_TO = redirectTo ?? "";
  return values;
}

// ── Interactive part ──

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Print the question, then stop echoing what is typed (the password never shows up)
      rl._writeToOutput = (text) => {
        if (text.includes(question)) rl.output.write(text);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

async function verifyGmailLogin(env, user, pass) {
  const { default: nodemailer } = await import("nodemailer");
  const port = Number(env.SMTP_PORT || GMAIL_DEFAULTS.SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || GMAIL_DEFAULTS.SMTP_HOST,
    port,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465,
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  });
  await transporter.verify();
}

function explainLoginError(err) {
  const text = String(err?.message ?? err);
  if (/535|Username and Password not accepted|Invalid login|BadCredentials/i.test(text)) {
    return "o Gmail recusou o e-mail ou a senha de app. Confira se é a SENHA DE APP (16 letras), não a senha normal da conta.";
  }
  if (/ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|timeout/i.test(text)) {
    return "não foi possível conectar ao Gmail. Verifique a internet ou o firewall.";
  }
  return text;
}

async function main() {
  const onlyIfMissing = process.argv.includes("--if-missing");

  if (!fs.existsSync(ENV_PATH)) fs.copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
  let content = fs.readFileSync(ENV_PATH, "utf8");

  if (onlyIfMissing && isEmailConfigured(content)) {
    console.log(`E-mail já configurado neste computador (${parseEnv(content).SMTP_USER}).`);
    return;
  }

  if (!process.stdin.isTTY) {
    console.log("Envio de e-mail não configurado. Rode 'pnpm email:config' em um terminal para configurar.");
    return;
  }

  console.log("");
  console.log("=== Configuração do envio de e-mail (só neste computador) ===");
  console.log("O SISAPA envia e-mails (ex.: solicitação de reunião) por uma conta Gmail.");
  console.log("Você precisa do endereço da conta e de uma SENHA DE APP (16 letras), criada em:");
  console.log("  https://myaccount.google.com/apppasswords");
  console.log("Os dados ficam só no arquivo .env deste computador (nunca vão para o GitHub).");
  console.log("");

  for (let attempt = 1; attempt <= 3; attempt++) {
    const user = await ask("E-mail Gmail do SISAPA (Enter para pular): ");
    if (!user) {
      console.log("Pulado: sem essa configuração, o SISAPA avisa que o e-mail não pôde ser enviado.");
      console.log("Para configurar depois: pnpm email:config");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) {
      console.log("Endereço de e-mail inválido. Tente de novo.\n");
      continue;
    }

    const pass = (await ask("Senha de app (não aparece enquanto você digita): ", { hidden: true })).replace(/\s+/g, "");
    if (!pass) {
      console.log("Senha vazia. Tente de novo.\n");
      continue;
    }

    process.stdout.write("Testando o login no Gmail... ");
    try {
      await verifyGmailLogin(parseEnv(content), user, pass);
      console.log("ok!");
    } catch (err) {
      console.log("falhou.");
      console.log(`  Motivo: ${explainLoginError(err)}\n`);
      continue;
    }

    console.log("");
    console.log("Durante testes, os e-mails podem ir todos para você em vez de para os alunos");
    console.log("(os alunos de demonstração usam endereços que podem ser de pessoas reais).");
    const redirectTo = await ask("Enviar TODOS os e-mails para (Enter = enviar normalmente aos alunos): ");

    content = setEnvValues(content, emailConfigValues(content, { user, pass, redirectTo }));
    fs.writeFileSync(ENV_PATH, content, "utf8");
    console.log(`\nE-mail configurado com sucesso (${user}).`);
    if (redirectTo) console.log(`Todos os e-mails serão desviados para ${redirectTo} (EMAIL_REDIRECT_TO no .env).`);
    return;
  }

  console.log("Não foi possível configurar depois de 3 tentativas. Nada foi salvo.");
  console.log("Para tentar de novo: pnpm email:config");
}

// Run only when executed directly (not when imported by tests)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("Erro ao configurar o e-mail:", err?.message ?? err);
    process.exitCode = 0; // never block the app from starting
  });
}
