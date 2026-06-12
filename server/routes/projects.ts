import { Router, Request, Response } from "express";
import { getDb } from "../db/database.js";
import { requireAuth, requireRole, projectSchema, sanitizeString } from "../middleware/auth.js";
import { addHistory, addNotification } from "../lib/helpers.js";

const router = Router();

// GET /api/projetos — list projects filtered by user role
router.get("/", requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const { status, search } = req.query;
  const user = req.user!;

  let query: string;
  let params: any[];

  if (user.role === "aluno") {
    query = `
      SELECT p.*,
             u.name as professor_name,
             (SELECT COUNT(*) FROM attachments WHERE project_id = p.id) as attachment_count,
             (SELECT feedback FROM evaluations WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1) as latest_feedback
      FROM projects p
      LEFT JOIN users u ON p.professor_id = u.id
      WHERE p.student_id = ?
    `;
    params = [user.userId];
  } else {
    // Professor sees projects assigned to them + submitted projects
    query = `
      SELECT p.*,
             s.name as student_name, s.email as student_email,
             (SELECT COUNT(*) FROM attachments WHERE project_id = p.id) as attachment_count,
             (SELECT feedback FROM evaluations WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1) as latest_feedback
      FROM projects p
      JOIN users s ON p.student_id = s.id
      WHERE (p.professor_id = ? OR (p.professor_id IS NULL AND p.status = 'submetido'))
    `;
    params = [user.userId];
  }

  if (status && status !== "todos") {
    query += " AND p.status = ?";
    params.push(status);
  }

  if (search && typeof search === "string" && search.trim()) {
    query += " AND p.title LIKE ?";
    params.push(`%${search.trim()}%`);
  }

  query += " ORDER BY p.updated_at DESC";

  const projects = db.prepare(query).all(...params) as any[];

  const result = projects.map((p) => ({
    ...p,
    keywords: tryParseJson(p.keywords, []),
  }));

  res.json(result);
});

// GET /api/projetos/:id — get project details
router.get("/:id", requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const { id } = req.params;
  const user = req.user!;

  const project = db
    .prepare(
      `SELECT p.*,
              s.name as student_name, s.email as student_email,
              u.name as professor_name
       FROM projects p
       JOIN users s ON p.student_id = s.id
       LEFT JOIN users u ON p.professor_id = u.id
       WHERE p.id = ?`
    )
    .get(id) as any;

  if (!project) {
    res.status(404).json({ error: "Projeto não encontrado." });
    return;
  }

  // Access control: student can only see own projects, professor sees assigned
  if (user.role === "aluno" && project.student_id !== user.userId) {
    res.status(403).json({ error: "Sem permissão para acessar este projeto." });
    return;
  }
  if (
    user.role === "professor" &&
    project.professor_id !== user.userId &&
    project.status !== "submetido"
  ) {
    res.status(403).json({ error: "Sem permissão para acessar este projeto." });
    return;
  }

  const attachments = db
    .prepare("SELECT id, original_name, size, mime_type, uploaded_at FROM attachments WHERE project_id = ?")
    .all(id);

  const evaluations = db
    .prepare(
      `SELECT e.*, u.name as professor_name
       FROM evaluations e
       JOIN users u ON e.professor_id = u.id
       WHERE e.project_id = ?
       ORDER BY e.created_at DESC`
    )
    .all(id);

  const history = db
    .prepare(
      `SELECT h.*, u.name as user_name
       FROM history h
       LEFT JOIN users u ON h.user_id = u.id
       WHERE h.project_id = ?
       ORDER BY h.created_at ASC`
    )
    .all(id);

  res.json({
    ...project,
    keywords: tryParseJson(project.keywords, []),
    attachments,
    evaluations,
    history,
  });
});

// POST /api/projetos — create draft project
router.post("/", requireAuth, requireRole("aluno"), (req: Request, res: Response): void => {
  const parse = projectSchema.partial().safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.errors[0].message });
    return;
  }

  const data = parse.data;
  const db = getDb();
  const user = req.user!;

  const result = db
    .prepare(
      `INSERT INTO projects (title, description, objectives, impact, public_target, schedule, resources, area, keywords, proposal_type, duration, student_id)
       VALUES (@title, @description, @objectives, @impact, @public_target, @schedule, @resources, @area, @keywords, @proposal_type, @duration, @student_id)`
    )
    .run({
      title: sanitizeString(data.title ?? "Novo Projeto"),
      description: sanitizeString(data.description ?? ""),
      objectives: sanitizeString(data.objectives ?? ""),
      impact: sanitizeString(data.impact ?? ""),
      public_target: sanitizeString(data.public_target ?? ""),
      schedule: sanitizeString(data.schedule ?? ""),
      resources: sanitizeString(data.resources ?? ""),
      area: sanitizeString(data.area ?? ""),
      keywords: JSON.stringify((data.keywords ?? []).map((k) => sanitizeString(k))),
      proposal_type: sanitizeString(data.proposal_type ?? ""),
      duration: sanitizeString(data.duration ?? ""),
      student_id: user.userId,
    });

  const projectId = result.lastInsertRowid as number;
  addHistory(projectId, user.userId, "criacao", "Projeto criado como rascunho.");

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as any;
  res.status(201).json({ ...project, keywords: tryParseJson(project.keywords, []) });
});

// PUT /api/projetos/:id — update project
router.put("/:id", requireAuth, requireRole("aluno"), (req: Request, res: Response): void => {
  const parse = projectSchema.partial().safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.errors[0].message });
    return;
  }

  const db = getDb();
  const { id } = req.params;
  const user = req.user!;

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;

  if (!project) {
    res.status(404).json({ error: "Projeto não encontrado." });
    return;
  }
  if (project.student_id !== user.userId) {
    res.status(403).json({ error: "Sem permissão para editar este projeto." });
    return;
  }
  if (!["rascunho", "ajustes_solicitados"].includes(project.status)) {
    res.status(400).json({ error: "Projeto não pode ser editado no status atual." });
    return;
  }

  const data = parse.data;

  db.prepare(
    `UPDATE projects SET
       title = COALESCE(@title, title),
       description = COALESCE(@description, description),
       objectives = COALESCE(@objectives, objectives),
       impact = COALESCE(@impact, impact),
       public_target = COALESCE(@public_target, public_target),
       schedule = COALESCE(@schedule, schedule),
       resources = COALESCE(@resources, resources),
       area = COALESCE(@area, area),
       keywords = COALESCE(@keywords, keywords),
       proposal_type = COALESCE(@proposal_type, proposal_type),
       duration = COALESCE(@duration, duration),
       updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id: Number(id),
    title: data.title ? sanitizeString(data.title) : null,
    description: data.description != null ? sanitizeString(data.description) : null,
    objectives: data.objectives != null ? sanitizeString(data.objectives) : null,
    impact: data.impact != null ? sanitizeString(data.impact) : null,
    public_target: data.public_target != null ? sanitizeString(data.public_target) : null,
    schedule: data.schedule != null ? sanitizeString(data.schedule) : null,
    resources: data.resources != null ? sanitizeString(data.resources) : null,
    area: data.area != null ? sanitizeString(data.area) : null,
    keywords: data.keywords ? JSON.stringify(data.keywords.map((k) => sanitizeString(k))) : null,
    proposal_type: data.proposal_type != null ? sanitizeString(data.proposal_type) : null,
    duration: data.duration != null ? sanitizeString(data.duration) : null,
  });

  const updated = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;
  res.json({ ...updated, keywords: tryParseJson(updated.keywords, []) });
});

// POST /api/projetos/:id/submit — submit project for review
router.post(
  "/:id/submit",
  requireAuth,
  requireRole("aluno"),
  (req: Request, res: Response): void => {
    const db = getDb();
    const { id } = req.params;
    const user = req.user!;

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;

    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado." });
      return;
    }
    if (project.student_id !== user.userId) {
      res.status(403).json({ error: "Sem permissão." });
      return;
    }
    if (!["rascunho", "ajustes_solicitados"].includes(project.status)) {
      res.status(400).json({ error: "Projeto já foi submetido." });
      return;
    }
    if (!project.title || !project.description) {
      res.status(400).json({ error: "Preencha título e descrição antes de submeter." });
      return;
    }

    db.prepare(
      "UPDATE projects SET status = 'submetido', progress = 10, updated_at = datetime('now') WHERE id = ?"
    ).run(id);

    addHistory(Number(id), user.userId, "submissao", "Projeto submetido para avaliação.");

    // Notify all professors if no professor assigned
    if (!project.professor_id) {
      const professors = db
        .prepare("SELECT id FROM users WHERE role = 'professor' AND authorized = 1")
        .all() as any[];
      professors.forEach((p) => {
        addNotification(p.id, Number(id), `Novo projeto '${project.title}' aguarda avaliação.`, "info");
      });
    } else {
      addNotification(
        project.professor_id,
        Number(id),
        `Projeto '${project.title}' foi reenviado após ajustes.`,
        "info"
      );
    }

    res.json({ message: "Projeto submetido com sucesso." });
  }
);

// POST /api/projetos/:id/assign — professor assigns self to project
router.post(
  "/:id/assign",
  requireAuth,
  requireRole("professor"),
  (req: Request, res: Response): void => {
    const db = getDb();
    const { id } = req.params;
    const user = req.user!;

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;

    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado." });
      return;
    }
    if (project.status !== "submetido") {
      res.status(400).json({ error: "Projeto não está disponível para atribuição." });
      return;
    }
    if (project.professor_id && project.professor_id !== user.userId) {
      res.status(409).json({ error: "Projeto já atribuído a outro professor." });
      return;
    }

    db.prepare(
      "UPDATE projects SET professor_id = ?, status = 'em_analise', progress = 30, updated_at = datetime('now') WHERE id = ?"
    ).run(user.userId, id);

    addHistory(Number(id), user.userId, "avaliacao", `Professor ${user.name} iniciou a avaliação.`);

    const student = db
      .prepare("SELECT id FROM users WHERE id = (SELECT student_id FROM projects WHERE id = ?)")
      .get(id) as any;

    if (student) {
      addNotification(
        student.id,
        Number(id),
        `Seu projeto está sendo avaliado pelo ${user.name}.`,
        "info"
      );
    }

    res.json({ message: "Projeto atribuído com sucesso." });
  }
);

// DELETE /api/projetos/:id — delete draft project
router.delete(
  "/:id",
  requireAuth,
  requireRole("aluno"),
  (req: Request, res: Response): void => {
    const db = getDb();
    const { id } = req.params;
    const user = req.user!;

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;

    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado." });
      return;
    }
    if (project.student_id !== user.userId) {
      res.status(403).json({ error: "Sem permissão." });
      return;
    }
    if (project.status !== "rascunho") {
      res.status(400).json({ error: "Só é possível excluir projetos em rascunho." });
      return;
    }

    db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    res.json({ message: "Projeto excluído." });
  }
);

function tryParseJson(val: string | null, fallback: any): any {
  try {
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export default router;
