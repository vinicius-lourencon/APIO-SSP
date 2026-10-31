// Integration tests: real createServer() on an ephemeral port, throwaway SQLite DB and uploads dir.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { setEmailSenderForTests, type OutgoingEmail } from "./services/email/index";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sisapa-test-"));
const uploadsDir = path.join(tmpDir, "uploads");
let server: Server;
let base = "";

const STUDENT = "joao.silva@estudante.ifms.edu.br";
const STUDENT_2 = "maria.oliveira@estudante.ifms.edu.br";
const PROFESSOR = "ana.costa@ifms.edu.br";
const PROFESSOR_2 = "carlos.lima@ifms.edu.br";

async function api(
  method: string,
  url: string,
  opts: { token?: string; body?: unknown; form?: FormData; headers?: Record<string, string> } = {},
) {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }
  const res = await fetch(`${base}/api${url}`, { method, headers, body });
  const text = await res.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {
    // binary/text responses (downloads)
  }
  return { status: res.status, data, headers: res.headers, contentType: res.headers.get("content-type") ?? "" };
}

// Tokens are cached: /api/auth/* is rate limited (20 requests per 15 min)
const tokens = new Map<string, string>();
async function login(email: string): Promise<string> {
  if (!tokens.has(email)) {
    const res = await api("POST", "/auth/login", { body: { email, password: "senha123" } });
    expect(res.status).toBe(200);
    tokens.set(email, res.data.token);
  }
  return tokens.get(email)!;
}

function pdfForm(name = "plano.pdf"): FormData {
  const form = new FormData();
  form.append("files", new Blob(["%PDF-1.4\n%teste\n"], { type: "application/pdf" }), name);
  return form;
}

const uploadedFiles = () => (fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0);

beforeAll(async () => {
  process.env.SISAPA_DB_PATH = path.join(tmpDir, "test.db");
  process.env.SISAPA_UPLOADS_DIR = uploadsDir;
  delete process.env.NODE_ENV; // dev mode: seed + dev JWT secret
  // Isolate from the developer's real .env (dotenv never overrides keys that already exist):
  // no real SMTP account and no redirect while testing
  for (const key of ["SMTP_USER", "SMTP_PASS", "MAIL_FROM", "EMAIL_TRANSPORT", "EMAIL_REDIRECT_TO", "CORS_ORIGINS"]) {
    process.env[key] = "";
  }
  const { createServer } = await import("./index");
  server = createServer().listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}, 30_000);

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  const { getDb } = await import("./db/database");
  getDb().close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("cadastro e login", () => {
  it("exige o domínio institucional de cada perfil", async () => {
    const register = (email: string, role: string) =>
      api("POST", "/auth/register", { body: { name: "Teste Silva", email, password: "123456", role } });

    expect((await register("prof@gmail.com", "professor")).status).toBe(400);
    expect((await register("aluno@ifms.edu.br", "aluno")).status).toBe(400);
    expect((await register("prof@estudante.ifms.edu.br", "professor")).status).toBe(400);
    expect((await register("novo.aluno@estudante.ifms.edu.br", "aluno")).status).toBe(201);
    expect((await register("Novo.Prof@IFMS.edu.br", "professor")).status).toBe(201);
  });

  it("recusa token inválido", async () => {
    expect((await api("GET", "/auth/me", { token: "invalido" })).status).toBe(401);
  });
});

describe("permissões", () => {
  it("aluno não assume nem avalia projetos", async () => {
    const student = await login(STUDENT);
    expect((await api("POST", "/projetos/4/assign", { token: student })).status).toBe(403);
    const evaluation = { project_id: 4, feedback: "x", decision: "aprovado" };
    expect((await api("POST", "/avaliacoes", { token: student, body: evaluation })).status).toBe(403);
  });

  it("aluno não vê projeto de outro aluno", async () => {
    const student2 = await login(STUDENT_2);
    expect((await api("GET", "/projetos/1", { token: student2 })).status).toBe(403);
  });
});

describe("ciclo completo: submissão → ajustes → reenvio → reavaliação", () => {
  const title = `Horta d'água "Viva" <b> & cia`;
  let student: string, student2: string, professor: string, professor2: string;
  let projectId: number, attachmentId: number;

  beforeAll(async () => {
    [student, student2, professor, professor2] = await Promise.all(
      [STUDENT, STUDENT_2, PROFESSOR, PROFESSOR_2].map(login),
    );
  });

  it("grava o texto exatamente como digitado", async () => {
    const res = await api("POST", "/projetos", {
      token: student,
      body: { title, description: "Descrição <inicial>", keywords: ["d'água"] },
    });
    expect(res.status).toBe(201);
    expect(res.data.title).toBe(title);
    expect(res.data.keywords).toEqual(["d'água"]);
    projectId = res.data.id;
  });

  it("aceita upload do dono e recusa o de outro aluno sem gravar arquivo", async () => {
    const ok = await api("POST", `/files/upload/${projectId}`, { token: student, form: pdfForm() });
    expect(ok.status).toBe(201);
    attachmentId = ok.data.files[0].id;

    const before = uploadedFiles();
    const denied = await api("POST", `/files/upload/${projectId}`, { token: student2, form: pdfForm() });
    expect(denied.status).toBe(403);
    expect(uploadedFiles()).toBe(before);
  });

  it("submete e bloqueia novos anexos", async () => {
    expect((await api("POST", `/projetos/${projectId}/submit`, { token: student })).status).toBe(200);
    const before = uploadedFiles();
    const res = await api("POST", `/files/upload/${projectId}`, { token: student, form: pdfForm() });
    expect(res.status).toBe(400);
    expect(uploadedFiles()).toBe(before);
  });

  it("professor vê o projeto aguardando avaliador, mas só baixa anexos depois de assumir", async () => {
    expect((await api("GET", `/projetos/${projectId}`, { token: professor2 })).status).toBe(200);
    expect((await api("GET", `/files/${attachmentId}/download`, { token: professor2 })).status).toBe(403);
    expect((await api("GET", `/files/${attachmentId}/download`)).status).toBe(401);
  });

  it("um professor assume; o outro perde acesso", async () => {
    expect((await api("POST", `/projetos/${projectId}/assign`, { token: professor })).status).toBe(200);
    expect((await api("POST", `/projetos/${projectId}/assign`, { token: professor2 })).status).not.toBe(200);
    expect((await api("GET", `/projetos/${projectId}`, { token: professor2 })).status).toBe(403);

    const download = await api("GET", `/files/${attachmentId}/download`, { token: professor });
    expect(download.status).toBe(200);
    expect(download.contentType).toContain("application/pdf");
  });

  it("valida feedback e justificativa", async () => {
    const noFeedback = await api("POST", "/avaliacoes", { token: professor, body: { project_id: projectId, decision: "aprovado" } });
    expect(noFeedback.status).toBe(400);
    const noJustification = await api("POST", "/avaliacoes", {
      token: professor,
      body: { project_id: projectId, feedback: "x", decision: "ajustes_solicitados" },
    });
    expect(noJustification.status).toBe(400);
  });

  it("solicita ajustes, aluno corrige e reenvia ao mesmo avaliador", async () => {
    const evaluation = await api("POST", "/avaliacoes", {
      token: professor,
      body: { project_id: projectId, feedback: "Melhorar cronograma", decision: "ajustes_solicitados", justification: "Falta cronograma" },
    });
    expect(evaluation.status).toBe(201);

    expect((await api("PUT", `/projetos/${projectId}`, { token: student, body: { schedule: "Novo cronograma" } })).status).toBe(200);
    expect((await api("POST", `/projetos/${projectId}/submit`, { token: student })).status).toBe(200);

    const project = (await api("GET", `/projetos/${projectId}`, { token: professor })).data;
    expect(project.status).toBe("em_analise");
    expect(project.professor_id).toBe(3);
    expect(project.history.map((h: any) => h.type)).toContain("ajuste");

    const notifications = (await api("GET", "/notificacoes", { token: professor })).data.notifications;
    expect(notifications.some((n: any) => n.message.includes("reenviado"))).toBe(true);
    expect((await api("GET", `/projetos/${projectId}`, { token: professor2 })).status).toBe(403);
  });

  it("o mesmo professor reavalia e aprova; não há avaliação fora de em_analise", async () => {
    const approve = await api("POST", "/avaliacoes", {
      token: professor,
      body: { project_id: projectId, feedback: "Agora sim", decision: "aprovado" },
    });
    expect(approve.status).toBe(201);

    const project = (await api("GET", `/projetos/${projectId}`, { token: student })).data;
    expect(project.status).toBe("aprovado");
    expect(project.progress).toBe(100);
    expect(project.evaluations).toHaveLength(2);

    const again = await api("POST", "/avaliacoes", {
      token: professor,
      body: { project_id: projectId, feedback: "de novo", decision: "reprovado", justification: "x" },
    });
    expect(again.status).toBe(400);

    const notifications = (await api("GET", "/notificacoes", { token: student })).data.notifications;
    expect(notifications.some((n: any) => n.message.includes(title))).toBe(true);
  });

  it("estatísticas do avaliador batem com a lista de projetos", async () => {
    const list = (await api("GET", "/projetos", { token: professor })).data as any[];
    const stats = (await api("GET", "/avaliacoes/stats", { token: professor })).data;
    const pending = list.filter(
      (p) => (p.professor_id === null && p.status === "submetido") || (p.professor_id === 3 && p.status === "em_analise"),
    ).length;
    expect(stats.pending).toBe(pending);
    expect(stats.approved).toBe(list.filter((p) => p.professor_id === 3 && p.status === "aprovado").length);
  });
});

describe("rascunhos", () => {
  it("excluir rascunho remove também os arquivos anexados", async () => {
    const student = await login(STUDENT);
    const draft = await api("POST", "/projetos", { token: student, body: { title: "Rascunho com anexo" } });
    await api("POST", `/files/upload/${draft.data.id}`, { token: student, form: pdfForm() });
    const before = uploadedFiles();

    expect((await api("DELETE", `/projetos/${draft.data.id}`, { token: student })).status).toBe(200);
    await new Promise((r) => setTimeout(r, 200)); // file removal is async
    expect(uploadedFiles()).toBe(before - 1);
  });
});

describe("solicitação de reunião por e-mail", () => {
  // Seed: projects 1 and 3 belong to João and are assigned to Ana (id 3); project 2 to Carlos
  const sent: OutgoingEmail[] = [];
  let student: string, student2: string, professor: string, professor2: string;

  const meeting = (projectId: number, token: string | undefined, body: unknown = {}) =>
    api("POST", `/projetos/${projectId}/reuniao`, { token, body });

  beforeAll(async () => {
    setEmailSenderForTests(async (email) => {
      sent.push(email);
    });
    [student, student2, professor, professor2] = await Promise.all(
      [STUDENT, STUDENT_2, PROFESSOR, PROFESSOR_2].map(login),
    );
  });

  afterAll(() => setEmailSenderForTests(null));

  it("só o professor atribuído pode solicitar; demais perfis recebem erro de permissão", async () => {
    expect((await meeting(1, professor2)).status).toBe(403); // outro professor
    expect((await meeting(1, student)).status).toBe(403); // o próprio aluno
    expect((await meeting(1, student2)).status).toBe(403); // outro aluno
    expect((await meeting(1, undefined)).status).toBe(401); // sem login
    expect((await meeting(9999, professor)).status).toBe(404);
    expect(sent).toHaveLength(0);
  });

  it("valida data, tamanho da mensagem e local", async () => {
    expect((await meeting(1, professor, { proposed_at: "2020-01-10T10:00" })).status).toBe(400); // passado
    expect((await meeting(1, professor, { proposed_at: "2099-02-30T10:00" })).status).toBe(400); // não existe
    expect((await meeting(1, professor, { proposed_at: "amanhã" })).status).toBe(400);
    expect((await meeting(1, professor, { message: "x".repeat(2001) })).status).toBe(400);
    expect((await meeting(1, professor, { location: "x".repeat(201) })).status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it("recusa quando o aluno não tem e-mail válido", async () => {
    const { getDb } = await import("./db/database");
    const db = getDb();
    const original = (db.prepare("SELECT email FROM users WHERE id = 1").get() as { email: string }).email;
    db.prepare("UPDATE users SET email = 'sem-email-valido' WHERE id = 1").run();
    try {
      const res = await meeting(3, professor);
      expect(res.status).toBe(422);
      expect(res.data.error).toMatch(/e-mail válido/);
    } finally {
      db.prepare("UPDATE users SET email = ? WHERE id = 1").run(original);
    }
    expect(sent).toHaveLength(0);
  });

  it("falha do provedor de e-mail: 502, nada registrado e o limite não é consumido", async () => {
    const historyBefore = (await api("GET", "/projetos/3", { token: professor })).data.history.length;
    setEmailSenderForTests(async () => {
      throw new Error("SMTP indisponível");
    });
    try {
      const res = await meeting(3, professor, { message: "Olá" });
      expect(res.status).toBe(502);
      expect(res.data.error).toMatch(/Não foi possível enviar/);
    } finally {
      setEmailSenderForTests(async (email) => {
        sent.push(email);
      });
    }
    const project = (await api("GET", "/projetos/3", { token: professor })).data;
    expect(project.history.length).toBe(historyBefore);
    expect(project.meeting_cooldown_until).toBeNull();
  });

  it("envia o e-mail ao aluno com reply-to do professor, sanitiza a mensagem e registra tudo", async () => {
    const res = await meeting(3, professor, {
      message: "<script>alert(1)</script>\nPodemos conversar na terça?",
      proposed_at: "2099-05-10T14:30",
      location: "Sala 3, Bloco B",
    });
    expect(res.status).toBe(201);
    expect(res.data.sentTo).toBe(STUDENT);
    expect(res.data.scheduleUpdated).toBe(true);

    expect(sent).toHaveLength(1);
    const email = sent[0];
    expect(email.to).toBe(STUDENT);
    expect(email.replyTo).toBe(PROFESSOR);
    expect(email.subject).toContain("Solicitação de reunião");
    expect(email.text).toContain("Prof. Ana Costa");
    expect(email.text).toContain("10/05/2099 às 14:30");
    expect(email.text).toContain("Podemos conversar na terça?");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");

    const project = (await api("GET", "/projetos/3", { token: professor })).data;
    expect(project.history.at(-1).type).toBe("reuniao");
    expect(project.schedule.split("\n").at(-1)).toBe(
      "📅 Reunião solicitada por Prof. Ana Costa: 10/05/2099 às 14:30 — Local: Sala 3, Bloco B",
    );
    expect(project.meeting_cooldown_until).toBeTruthy();

    const notifications = (await api("GET", "/notificacoes", { token: student })).data.notifications as any[];
    const meetingNotification = notifications.find((n) => n.project_id === 3 && n.message.includes("solicitou uma reunião"));
    expect(meetingNotification).toBeTruthy();
    expect(meetingNotification.read).toBe(0);
  });

  it("limita a 1 solicitação a cada 10 minutos por professor e projeto", async () => {
    const again = await meeting(3, professor, { message: "De novo" });
    expect(again.status).toBe(429);
    expect(Number(again.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(again.data.error).toMatch(/Poderá enviar novamente/);

    // other project of the same professor is not affected
    expect((await meeting(1, professor)).status).toBe(201);
    expect(sent).toHaveLength(2);
  });

  it("sem data, não altera o cronograma", async () => {
    const project = (await api("GET", "/projetos/1", { token: professor })).data;
    expect(project.schedule).not.toContain("Reunião solicitada");
  });

  it("dois cliques simultâneos enviam um único e-mail", async () => {
    const own = ((await api("GET", "/projetos", { token: professor })).data as any[]).find(
      (p) => p.professor_id === 3 && ![1, 3].includes(p.id),
    );
    expect(own).toBeTruthy();
    const before = sent.length;
    const results = await Promise.all([meeting(own.id, professor), meeting(own.id, professor)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 429]);
    expect(sent.length).toBe(before + 1);
  });
});

describe("erros e CORS", () => {
  it("responde JSON para corpo malformado e rota inexistente", async () => {
    const malformed = await api("POST", "/auth/login", { body: "{nao-json" });
    expect(malformed.status).toBe(400);
    expect(malformed.data.error).toBeTruthy();

    const missing = await api("GET", "/nao-existe");
    expect(missing.status).toBe(404);
    expect(missing.data.error).toBeTruthy();
  });

  it("aceita origens locais e recusa origens externas com 403", async () => {
    const body = { email: STUDENT, password: "senha123" };
    for (const origin of ["http://localhost:8080", "http://[::1]:8080", "http://127.0.0.1:3000"]) {
      expect((await api("POST", "/auth/login", { body, headers: { Origin: origin } })).status).toBe(200);
    }
    const external = await api("POST", "/auth/login", { body, headers: { Origin: "http://evil.example" } });
    expect(external.status).toBe(403);
    expect(external.data.error).toBeTruthy();
  });
});
