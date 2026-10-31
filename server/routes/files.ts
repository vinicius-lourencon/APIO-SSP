import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getDb } from "../db/database.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// SISAPA_UPLOADS_DIR lets tests use a throwaway folder
const UPLOADS_DIR = path.resolve(process.env.SISAPA_UPLOADS_DIR || path.join(process.cwd(), "uploads"));

// Multer configuration with security validations
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Created on first upload, not at import time (keeps builds/tests free of side effects)
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, `${unique}${ext}`);
  },
});

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const EDITABLE_STATUSES = ["rascunho", "ajustes_solicitados"];

// Deletes files multer already stored for a request that ended in error
function removeUploaded(req: Request): void {
  for (const file of (req.files as Express.Multer.File[] | undefined) ?? []) {
    fs.rm(file.path, { force: true }, () => {});
  }
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES, files: 2 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error("Tipo de arquivo não permitido. Use PDF, DOC ou DOCX."));
    }
    cb(null, true);
  },
});

// POST /api/files/upload/:projectId
router.post(
  "/upload/:projectId",
  requireAuth,
  requireRole("aluno"),
  (req: Request, res: Response): void => {
    const db = getDb();
    const { projectId } = req.params;
    const user = req.user!;

    // Validate before multer writes anything to disk
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as any;
    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado." });
      return;
    }
    if (project.student_id !== user.userId) {
      res.status(403).json({ error: "Sem permissão." });
      return;
    }
    if (!EDITABLE_STATUSES.includes(project.status)) {
      res.status(400).json({ error: "Não é possível anexar arquivos a projetos já submetidos." });
      return;
    }

    const uploader = upload.array("files", 2);

    uploader(req, res, (err) => {
      if (err) {
        removeUploaded(req);
        const message =
          err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? "Arquivo muito grande. Máximo 25MB."
            : err.message;
        res.status(400).json({ error: message });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: "Nenhum arquivo enviado." });
        return;
      }

      const inserted = files.map((file) => {
        const result = db
          .prepare(
            `INSERT INTO attachments (project_id, filename, original_name, filepath, size, mime_type)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(
            Number(projectId),
            file.filename,
            path.basename(file.originalname),
            file.path,
            file.size,
            file.mimetype
          );
        return {
          id: result.lastInsertRowid,
          original_name: file.originalname,
          size: file.size,
          mime_type: file.mimetype,
        };
      });

      res.status(201).json({ files: inserted });
    });
  }
);

// GET /api/files/:attachmentId/download
router.get(
  "/:attachmentId/download",
  requireAuth,
  (req: Request, res: Response): void => {
    const db = getDb();
    const { attachmentId } = req.params;
    const user = req.user!;

    const attachment = db
      .prepare(
        `SELECT a.*, p.student_id, p.professor_id
         FROM attachments a
         JOIN projects p ON a.project_id = p.id
         WHERE a.id = ?`
      )
      .get(attachmentId) as any;

    if (!attachment) {
      res.status(404).json({ error: "Arquivo não encontrado." });
      return;
    }

    // Authorization: student owner or assigned professor
    if (
      (user.role === "aluno" && attachment.student_id !== user.userId) ||
      (user.role === "professor" && attachment.professor_id !== user.userId)
    ) {
      res.status(403).json({ error: "Sem permissão para baixar este arquivo." });
      return;
    }

    const filePath = attachment.filepath;
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Arquivo não encontrado no servidor." });
      return;
    }

    // Prevent path traversal: ensure file is within UPLOADS_DIR
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(UPLOADS_DIR)) {
      res.status(400).json({ error: "Requisição inválida." });
      return;
    }

    const safeOriginalName = path.basename(attachment.original_name).replace(/[^a-zA-Z0-9._-]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${safeOriginalName}"`);
    res.setHeader("Content-Type", attachment.mime_type || "application/octet-stream");
    res.sendFile(resolvedPath);
  }
);

// DELETE /api/files/:attachmentId
router.delete(
  "/:attachmentId",
  requireAuth,
  requireRole("aluno"),
  (req: Request, res: Response): void => {
    const db = getDb();
    const { attachmentId } = req.params;
    const user = req.user!;

    const attachment = db
      .prepare(
        `SELECT a.*, p.student_id, p.status
         FROM attachments a
         JOIN projects p ON a.project_id = p.id
         WHERE a.id = ?`
      )
      .get(attachmentId) as any;

    if (!attachment) {
      res.status(404).json({ error: "Arquivo não encontrado." });
      return;
    }
    if (attachment.student_id !== user.userId) {
      res.status(403).json({ error: "Sem permissão." });
      return;
    }
    if (!EDITABLE_STATUSES.includes(attachment.status)) {
      res.status(400).json({ error: "Não é possível remover arquivos de projetos já submetidos." });
      return;
    }

    if (fs.existsSync(attachment.filepath)) {
      fs.unlinkSync(attachment.filepath);
    }

    db.prepare("DELETE FROM attachments WHERE id = ?").run(attachmentId);
    res.json({ message: "Arquivo removido." });
  }
);

export default router;
