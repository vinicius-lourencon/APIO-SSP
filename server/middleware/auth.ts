import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "sisapa-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "8h";

export interface JwtPayload {
  userId: number;
  email: string;
  role: "aluno" | "professor";
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação não fornecido." });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
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

export function requireProfessorAuthorized(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "professor") {
    res.status(403).json({ error: "Acesso restrito a professores autorizados." });
    return;
  }
  next();
}

// Input sanitization: strip HTML tags to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
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
});

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

export const evaluationSchema = z.object({
  project_id: z.number().int().positive(),
  opinion: z.string().max(5000).default(""),
  feedback: z.string().max(5000).default(""),
  decision: z.enum(["aprovado", "reprovado", "ajustes_solicitados"]),
  justification: z.string().max(5000).default(""),
});
