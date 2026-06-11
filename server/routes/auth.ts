import { Router, Request, Response } from "express";
import bcryptjs from "bcryptjs";
import { getDb } from "../db/database.js";
import {
  signToken,
  requireAuth,
  loginSchema,
  registerSchema,
  sanitizeString,
} from "../middleware/auth.js";

const router = Router();

// POST /api/auth/login
router.post("/login", (req: Request, res: Response): void => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.errors[0].message });
    return;
  }

  const { email, password } = parse.data;
  const db = getDb();

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim()) as any;

  if (!user) {
    res.status(401).json({ error: "E-mail ou senha inválidos." });
    return;
  }

  const valid = bcryptjs.compareSync(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "E-mail ou senha inválidos." });
    return;
  }

  if (!user.authorized) {
    res.status(403).json({ error: "Sua conta ainda não foi autorizada." });
    return;
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      matricula: user.matricula,
      curso: user.curso,
      semestre: user.semestre,
      siape: user.siape,
      departamento: user.departamento,
    },
  });
});

// POST /api/auth/register
router.post("/register", (req: Request, res: Response): void => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.errors[0].message });
    return;
  }

  const data = parse.data;
  const db = getDb();

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(data.email.toLowerCase().trim());

  if (existing) {
    res.status(409).json({ error: "Este e-mail já está cadastrado." });
    return;
  }

  if (data.cpf) {
    const cpfExists = db.prepare("SELECT id FROM users WHERE cpf = ?").get(data.cpf);
    if (cpfExists) {
      res.status(409).json({ error: "Este CPF já está cadastrado." });
      return;
    }
  }

  const hash = bcryptjs.hashSync(data.password, 12);

  const result = db
    .prepare(
      `INSERT INTO users (name, email, cpf, password_hash, role, matricula, curso, semestre, siape, departamento, authorized)
       VALUES (@name, @email, @cpf, @password_hash, @role, @matricula, @curso, @semestre, @siape, @departamento, @authorized)`
    )
    .run({
      name: sanitizeString(data.name),
      email: data.email.toLowerCase().trim(),
      cpf: data.cpf ?? null,
      password_hash: hash,
      role: data.role,
      matricula: data.matricula ?? null,
      curso: data.curso ?? null,
      semestre: data.semestre ?? null,
      siape: data.siape ?? null,
      departamento: data.departamento ?? null,
      authorized: 1,
    });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as any;

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      matricula: user.matricula,
      curso: user.curso,
      semestre: user.semestre,
      siape: user.siape,
      departamento: user.departamento,
    },
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.userId) as any;

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    matricula: user.matricula,
    curso: user.curso,
    semestre: user.semestre,
    siape: user.siape,
    departamento: user.departamento,
    created_at: user.created_at,
  });
});

export default router;
