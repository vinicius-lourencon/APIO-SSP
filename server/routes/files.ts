import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getDb } from "../db/database.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer configuration with security validations
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
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
    const uploader = upload.array("files", 2);

    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "Arquivo muito grande. Máximo 25MB." });
        } else {
          res.status(400).json({ error: err.message });
        }
        return;
      }
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }

      const db = getDb();
      const { projectId } = req.params;
      const user = req.user!;

      const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as any;
      if (!project) {
        res.status(404).json({ error: "Projeto não encontrado." });
        return;
      }
      if (project.student_id !== user.userId) {
        res.status(403).json({ error: "Sem permissão." });
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
    if (!["rascunho", "ajustes_solicitados"].includes(attachment.status)) {
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
