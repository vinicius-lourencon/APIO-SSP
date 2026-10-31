import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ROLE_EMAIL_DOMAINS, emailMatchesRole } from "../../shared/api.js";

const JWT_DEV_SECRET = "sisapa-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "8h";

// Read lazily (not at import time) so `vite build` and tests can load this module
// without a secret; createServer() calls assertAuthConfig() to fail fast at startup.
function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET não definido. Configure a variável de ambiente (veja .env.example) antes de iniciar em produção.");
  }
  return JWT_DEV_SECRET;
}

export function assertAuthConfig(): void {
  getJwtSecret();
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: "aluno" | "professor";
  name: string;
}

declare global {
  // Module augmentation of Express' global namespace is the documented way to type req.user
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação não fornecido." });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

export function requireRole(role: "aluno" | "professor") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado." });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: `Acesso negado. Requer perfil: ${role}.` });
      return;
    }
    next();
  };
}

// Normalizes free text before persisting. Text is stored as typed: React escapes it on
// output, and escaping here showed entities like &quot; on screen. Never render it as HTML.
export function sanitizeString(input: string): string {
  return input.trim();
}


// Zod schemas for request validation
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido.").max(255),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres.").max(128),
});

export const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres.").max(200),
  email: z.string().email("E-mail inválido.").max(255),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres.").max(128),
  role: z.enum(["aluno", "professor"]),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos numéricos.").optional(),
  matricula: z.string().max(20).optional(),
  curso: z.string().max(150).optional(),
  semestre: z.coerce.number().int().min(1).max(10).optional(),
  siape: z.string().max(20).optional(),
  departamento: z.string().max(150).optional(),
}).refine(
  (data) => emailMatchesRole(data.email, data.role),
  (data) => ({
    message:
      data.role === "professor"
        ? `Professores devem usar um e-mail ${ROLE_EMAIL_DOMAINS.professor}.`
        : `Alunos devem usar um e-mail ${ROLE_EMAIL_DOMAINS.aluno}.`,
    path: ["email"],
  }),
);

export const projectSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres.").max(300),
  description: z.string().max(5000).default(""),
  objectives: z.string().max(5000).default(""),
  impact: z.string().max(2000).default(""),
  public_target: z.string().max(500).default(""),
  schedule: z.string().max(2000).default(""),
  resources: z.string().max(2000).default(""),
  area: z.string().max(150).default(""),
  keywords: z.array(z.string().max(80)).default([]),
  proposal_type: z.string().max(100).default(""),
  duration: z.string().max(100).default(""),
});

export const meetingRequestSchema = z.object({
  message: z.string().max(2000, "A mensagem deve ter no máximo 2000 caracteres.").default(""),
  proposed_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Data e horário inválidos.")
    .optional()
    .or(z.literal("")),
  location: z.string().max(200, "O local deve ter no máximo 200 caracteres.").default(""),
});

export const evaluationSchema = z.object({
  project_id: z.number().int().positive(),
  opinion: z.string().max(5000).default(""),
  feedback: z.string({ required_error: "O feedback é obrigatório." }).trim().min(1, "O feedback é obrigatório.").max(5000),
  decision: z.enum(["aprovado", "reprovado", "ajustes_solicitados"]),
  justification: z.string().max(5000).default(""),
});
