// E-mail delivery isolated from the routes, so the provider can be swapped or reused.
// Configuration comes only from environment variables (see .env.example).
import nodemailer, { type Transporter } from "nodemailer";

export interface EmailMessage {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

export interface OutgoingEmail extends EmailMessage {
  from: string;
}

/** smtp = really sent; log = only printed to the terminal (EMAIL_TRANSPORT=log); test = captured by tests */
export type EmailDelivery = "smtp" | "log" | "test";

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Envio de e-mail não configurado no servidor (defina SMTP_USER e SMTP_PASS no .env).");
    this.name = "EmailNotConfiguredError";
  }
}

export class EmailDeliveryError extends Error {
  constructor(public readonly reason: unknown) {
    super(`Falha ao enviar e-mail: ${reason instanceof Error ? reason.message : String(reason)}`);
    this.name = "EmailDeliveryError";
  }
}

type Sender = (email: OutgoingEmail) => Promise<void>;

let testSender: Sender | null = null;

/** Tests only: capture (or make fail) outgoing e-mails instead of using SMTP/log. */
export function setEmailSenderForTests(sender: Sender | null): void {
  testSender = sender;
}

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: Transporter | null = null;
let transporterKey = "";

function getTransporter(): Transporter {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  const user = process.env.SMTP_USER!;
  const key = [host, port, secure, user].join("|");

  if (!transporter || key !== transporterKey) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: process.env.SMTP_PASS! },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    });
    transporterKey = key;
  }
  return transporter;
}

function fromAddress(): string {
  if (process.env.MAIL_FROM) return process.env.MAIL_FROM;
  return process.env.SMTP_USER ? `SISAPA <${process.env.SMTP_USER}>` : "SISAPA <nao-responda@sisapa.local>";
}

// Header values must never carry line breaks (header injection)
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export async function sendEmail(message: EmailMessage): Promise<{ delivery: EmailDelivery }> {
  const redirectTo = process.env.EMAIL_REDIRECT_TO?.trim();
  const email: OutgoingEmail = {
    ...message,
    from: fromAddress(),
    to: redirectTo || message.to,
    replyTo: message.replyTo ? singleLine(message.replyTo) : undefined,
    subject: singleLine(redirectTo ? `[para: ${message.to}] ${message.subject}` : message.subject),
  };

  try {
    if (testSender) {
      await testSender(email);
      return { delivery: "test" };
    }

    // Terminal-only mode must be switched on on purpose: an unconfigured server never
    // pretends to have sent anything (it fails with EmailNotConfiguredError below)
    if (process.env.EMAIL_TRANSPORT === "log") {
      console.log(
        [
          "────────── [e-mail NÃO enviado: modo log] ──────────",
          `De: ${email.from}`,
          `Para: ${email.to}`,
          email.replyTo ? `Responder para: ${email.replyTo}` : "",
          `Assunto: ${email.subject}`,
          "",
          email.text,
          "────────────────────────────────────────────────────",
        ]
          .filter((line) => line !== "")
          .join("\n"),
      );
      return { delivery: "log" };
    }

    if (!smtpConfigured()) throw new EmailNotConfiguredError();

    await getTransporter().sendMail({
      from: email.from,
      to: email.to,
      replyTo: email.replyTo,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return { delivery: "smtp" };
  } catch (err) {
    if (err instanceof EmailNotConfiguredError) throw err;
    throw new EmailDeliveryError(err);
  }
}
