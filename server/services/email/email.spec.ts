import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EmailDeliveryError,
  EmailNotConfiguredError,
  sendEmail,
  setEmailSenderForTests,
  type OutgoingEmail,
} from "./index";
import { meetingRequestEmail } from "./templates/meeting-request";

const ENV_KEYS = ["NODE_ENV", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "EMAIL_TRANSPORT", "EMAIL_REDIRECT_TO"];
const savedEnv: Record<string, string | undefined> = {};

const message = { to: "aluno@estudante.ifms.edu.br", replyTo: "prof@ifms.edu.br", subject: "Assunto", text: "Texto", html: "<p>Texto</p>" };

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  setEmailSenderForTests(null);
  vi.restoreAllMocks();
});

describe("sendEmail", () => {
  it("em desenvolvimento sem credenciais, só registra no terminal", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(sendEmail(message)).resolves.toEqual({ delivery: "log" });
    expect(log.mock.calls[0][0]).toContain("Para: aluno@estudante.ifms.edu.br");
  });

  it("em produção sem credenciais, recusa com EmailNotConfiguredError", async () => {
    process.env.NODE_ENV = "production";
    await expect(sendEmail(message)).rejects.toBeInstanceOf(EmailNotConfiguredError);
  });

  it("EMAIL_REDIRECT_TO desvia o destinatário e anota o original no assunto", async () => {
    process.env.EMAIL_REDIRECT_TO = "teste@exemplo.com";
    const sent: OutgoingEmail[] = [];
    setEmailSenderForTests(async (email) => {
      sent.push(email);
    });
    await sendEmail(message);
    expect(sent[0].to).toBe("teste@exemplo.com");
    expect(sent[0].subject).toBe("[para: aluno@estudante.ifms.edu.br] Assunto");
  });

  it("remove quebras de linha de cabeçalhos (injeção de cabeçalho)", async () => {
    const sent: OutgoingEmail[] = [];
    setEmailSenderForTests(async (email) => {
      sent.push(email);
    });
    await sendEmail({ ...message, subject: "Oi\r\nBcc: vitima@exemplo.com" });
    expect(sent[0].subject).toBe("Oi Bcc: vitima@exemplo.com");
  });

  it("falha do provedor vira EmailDeliveryError", async () => {
    setEmailSenderForTests(async () => {
      throw new Error("conexão recusada");
    });
    await expect(sendEmail(message)).rejects.toBeInstanceOf(EmailDeliveryError);
  });
});

describe("template de solicitação de reunião", () => {
  const data = {
    studentName: "João da Silva",
    professorName: "Prof. Ana Costa",
    professorEmail: "ana.costa@ifms.edu.br",
    projectTitle: 'Horta "Viva" <b>',
    message: '<img src=x onerror="alert(1)">\nTerça às 14h?',
    proposedAt: "10/05/2099 às 14:30",
    location: "Sala 3",
  };

  it("escapa todo conteúdo do usuário no HTML", () => {
    const { html } = meetingRequestEmail(data);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;<br>Terça às 14h?");
  });

  it("versão texto traz professor, projeto, data, local, mensagem e instrução de resposta", () => {
    const { subject, text } = meetingRequestEmail(data);
    expect(subject).toBe('Solicitação de reunião — projeto "Horta "Viva" <b>"');
    expect(text).toContain("Olá, João!");
    expect(text).toContain("Data e horário sugeridos: 10/05/2099 às 14:30");
    expect(text).toContain("Local: Sala 3");
    expect(text).toContain("Terça às 14h?");
    expect(text).toContain("responda a este e-mail");
  });

  it("sem mensagem nem data, não inclui essas seções", () => {
    const { text } = meetingRequestEmail({ ...data, message: "", proposedAt: null, location: "" });
    expect(text).not.toContain("Mensagem do professor");
    expect(text).not.toContain("Data e horário");
  });
});
