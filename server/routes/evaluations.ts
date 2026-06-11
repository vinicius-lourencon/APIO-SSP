import { Router, Request, Response } from "express";
import { getDb } from "../db/database.js";
import {
  requireAuth,
  requireRole,
  evaluationSchema,
  sanitizeString,
} from "../middleware/auth.js";

const router = Router();

function addHistory(
  projectId: number,
  userId: number | null,
  type: string,
  description: string
): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO history (project_id, user_id, type, description) VALUES (?, ?, ?, ?)"
  ).run(projectId, userId, type, description);
}

function addNotification(
  userId: number,
  projectId: number,
  message: string,
  type: string
): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO notifications (user_id, project_id, message, type) VALUES (?, ?, ?, ?)"
  ).run(userId, projectId, message, type);
}

function progressForDecision(decision: string): number {
  if (decision === "aprovado") return 100;
  if (decision === "reprovado") return 0;
  return 40;
}

// POST /api/avaliacoes — create evaluation
router.post(
  "/",
  requireAuth,
  requireRole("professor"),
  (req: Request, res: Response): void => {
    const parse = evaluationSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const data = parse.data;
    const db = getDb();
    const user = req.user!;

    if (
      (data.decision === "reprovado" || data.decision === "ajustes_solicitados") &&
      !data.justification?.trim()
    ) {
      res
        .status(400)
        .json({ error: "Justificativa é obrigatória para reprovação ou ajustes solicitados." });
      return;
    }

    const project = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(data.project_id) as any;

    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado." });
      return;
    }
    if (project.professor_id !== user.userId) {
      res.status(403).json({ error: "Você não é o avaliador deste projeto." });
      return;
    }
    if (!["submetido", "em_analise"].includes(project.status)) {
      res.status(400).json({ error: "Projeto não está disponível para avaliação." });
      return;
    }

    const newStatus =
      data.decision === "aprovado"
        ? "aprovado"
        : data.decision === "reprovado"
          ? "reprovado"
          : "ajustes_solicitados";

    const progress = progressForDecision(data.decision);

    const result = db
      .prepare(
        `INSERT INTO evaluations (project_id, professor_id, opinion, feedback, decision, justification)
         VALUES (@project_id, @professor_id, @opinion, @feedback, @decision, @justification)`
      )
      .run({
        project_id: data.project_id,
        professor_id: user.userId,
        opinion: sanitizeString(data.opinion ?? ""),
        feedback: sanitizeString(data.feedback ?? ""),
        decision: data.decision,
        justification: sanitizeString(data.justification ?? ""),
      });

    db.prepare(
      "UPDATE projects SET status = ?, progress = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(newStatus, progress, data.project_id);

    const decisionLabel: Record<string, string> = {
      aprovado: "aprovado",
      reprovado: "reprovado",
      ajustes_solicitados: "com ajustes solicitados",
    };

    addHistory(
      data.project_id,
      user.userId,
      "avaliacao",
      `Projeto avaliado: ${decisionLabel[data.decision]}.`
    );

    const notifTypeMap: Record<string, string> = {
      aprovado: "success",
      reprovado: "error",
      ajustes_solicitados: "warning",
    };

    const notifMessageMap: Record<string, string> = {
      aprovado: `Seu projeto '${project.title}' foi aprovado!`,
      reprovado: `Seu projeto '${project.title}' foi reprovado.`,
      ajustes_solicitados: `Ajustes foram solicitados no projeto '${project.title}'.`,
    };

    addNotification(
      project.student_id,
      data.project_id,
      notifMessageMap[data.decision],
      notifTypeMap[data.decision]
    );

    const evaluation = db
      .prepare("SELECT * FROM evaluations WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(evaluation);
  }
);

// GET /api/avaliacoes/projeto/:id — get evaluations for a project
router.get(
  "/projeto/:id",
  requireAuth,
  (req: Request, res: Response): void => {
    const db = getDb();
    const { id } = req.params;
    const user = req.user!;

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;
    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado." });
      return;
    }

    if (user.role === "aluno" && project.student_id !== user.userId) {
      res.status(403).json({ error: "Sem permissão." });
      return;
    }
    if (user.role === "professor" && project.professor_id !== user.userId) {
      res.status(403).json({ error: "Sem permissão." });
      return;
    }

    const evaluations = db
      .prepare(
        `SELECT e.*, u.name as professor_name
         FROM evaluations e
         JOIN users u ON e.professor_id = u.id
         WHERE e.project_id = ?
         ORDER BY e.created_at DESC`
      )
      .all(id);

    res.json(evaluations);
  }
);

// GET /api/avaliacoes/stats — professor stats
router.get(
  "/stats",
  requireAuth,
  requireRole("professor"),
  (req: Request, res: Response): void => {
    const db = getDb();
    const user = req.user!;

    const total = (
      db
        .prepare("SELECT COUNT(*) as c FROM projects WHERE professor_id = ?")
        .get(user.userId) as any
    ).c;

    const pending = (
      db
        .prepare(
          "SELECT COUNT(*) as c FROM projects WHERE (professor_id = ? OR (professor_id IS NULL AND status = 'submetido'))"
        )
        .get(user.userId) as any
    ).c;

    const approved = (
      db
        .prepare("SELECT COUNT(*) as c FROM projects WHERE professor_id = ? AND status = 'aprovado'")
        .get(user.userId) as any
    ).c;

    const adjustments = (
      db
        .prepare(
          "SELECT COUNT(*) as c FROM projects WHERE professor_id = ? AND status = 'ajustes_solicitados'"
        )
        .get(user.userId) as any
    ).c;

    res.json({ total, pending, approved, adjustments });
  }
);

export default router;
