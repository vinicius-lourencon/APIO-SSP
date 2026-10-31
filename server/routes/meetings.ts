import { Router, Request, Response } from "express";
import type Database from "better-sqlite3";
import { getDb } from "../db/database.js";
import { requireAuth, requireRole, meetingRequestSchema, sanitizeString } from "../middleware/auth.js";
import { addHistory, addNotification } from "../lib/helpers.js";
import { sendEmail, EmailNotConfiguredError, EmailDeliveryError } from "../services/email/index.js";
import { meetingRequestEmail } from "../services/email/templates/meeting-request.js";
import {
  MEETING_REQUEST_COOLDOWN_MINUTES,
  isValidEmail,
  professorLabel,
  type MeetingRequestResponse,
} from "../../shared/api.js";

const router = Router();

const COOLDOWN_SECONDS = MEETING_REQUEST_COOLDOWN_MINUTES * 60;

// Requests currently being sent (project:professor): blocks a double click that arrives
// before the first request is recorded
const inFlight = new Set<string>();

// Keeps line breaks and tabs, drops other control characters
function cleanText(value: string): string {
  // eslint-disable-next-line no-control-regex -- matching control characters is the point here
  return sanitizeString(value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""));
}

// "2026-10-15T14:00" → "15/10/2026 às 14:00"; null if it is not a real date
function formatProposedAt(value: string): { label: string; date: Date } | null {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || hour > 23 || minute > 59) {
    return null;
  }
  return { label: `${datePart.split("-").reverse().join("/")} às ${timePart}`, date };
}

function secondsSinceLastRequest(db: Database.Database, projectId: number, professorId: number): number | null {
  const row = db
    .prepare(
      `SELECT CAST(strftime('%s', 'now') - strftime('%s', created_at) AS INTEGER) AS elapsed
       FROM meeting_requests WHERE project_id = ? AND professor_id = ?
       ORDER BY id DESC LIMIT 1`
    )
    .get(projectId, professorId) as { elapsed: number } | undefined;
  return row ? row.elapsed : null;
}

/** ISO time when this professor may request a meeting for this project again (null = now). */
export function meetingCooldownUntil(db: Database.Database, projectId: number, professorId: number): string | null {
  const elapsed = secondsSinceLastRequest(db, projectId, professorId);
  if (elapsed === null || elapsed >= COOLDOWN_SECONDS) return null;
  return new Date(Date.now() + (COOLDOWN_SECONDS - elapsed) * 1000).toISOString();
}

// POST /api/projetos/:id/reuniao — assigned professor asks the student for a meeting by e-mail
router.post(
  "/:id/reuniao",
  requireAuth,
  requireRole("professor"),
  async (req: Request, res: Response): Promise<void> => {
    const parse = meetingRequestSchema.safeParse(req.body ?? {});
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const db = getDb();
    const projectId = Number(req.params.id);
    const user = req.user!;

    const project = db
      .prepare(
        `SELECT p.id, p.title, p.professor_id, p.student_id, s.name AS student_name, s.email AS student_email
         FROM projects p JOIN users s ON s.id = p.student_id
         WHERE p.id = ?`
      )
      .get(projectId) as any;

    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado." });
      return;
    }
    if (project.professor_id !== user.userId) {
      res.status(403).json({ error: "Apenas o professor responsável por este projeto pode solicitar reunião ao aluno." });
      return;
    }
    if (!isValidEmail(project.student_email)) {
      res.status(422).json({ error: "O aluno não possui um e-mail válido cadastrado. Não é possível enviar a solicitação." });
      return;
    }

    const message = cleanText(parse.data.message);
    const location = cleanText(parse.data.location);
    let proposed: { label: string; date: Date } | null = null;
    if (parse.data.proposed_at) {
      proposed = formatProposedAt(parse.data.proposed_at);
      if (!proposed) {
        res.status(400).json({ error: "Data e horário inválidos." });
        return;
      }
      if (proposed.date.getTime() < Date.now()) {
        res.status(400).json({ error: "A data sugerida para a reunião já passou." });
        return;
      }
    }

    // Rate limit: one request per professor per project every MEETING_REQUEST_COOLDOWN_MINUTES
    const elapsed = secondsSinceLastRequest(db, projectId, user.userId);
    if (elapsed !== null && elapsed < COOLDOWN_SECONDS) {
      const retryAfter = COOLDOWN_SECONDS - elapsed;
      const agoMin = Math.max(1, Math.floor(elapsed / 60));
      const waitMin = Math.ceil(retryAfter / 60);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: `Você já solicitou uma reunião para este projeto há ${agoMin} minuto(s). Poderá enviar novamente em ${waitMin} minuto(s).`,
        retryAfterSeconds: retryAfter,
        nextAllowedAt: new Date(Date.now() + retryAfter * 1000).toISOString(),
      });
      return;
    }

    const lockKey = `${projectId}:${user.userId}`;
    if (inFlight.has(lockKey)) {
      res.status(429).json({ error: "Já existe uma solicitação de reunião sendo enviada para este projeto." });
      return;
    }
    inFlight.add(lockKey);

    try {
      const professor = db.prepare("SELECT name, email FROM users WHERE id = ?").get(user.userId) as {
        name: string;
        email: string;
      };
      const professorName = professorLabel(professor.name);

      const email = meetingRequestEmail({
        studentName: project.student_name,
        professorName,
        professorEmail: professor.email,
        projectTitle: project.title,
        message,
        proposedAt: proposed?.label ?? null,
        location,
      });

      // Send first: history and notification are only recorded for e-mails that actually left
      try {
        await sendEmail({ to: project.student_email, replyTo: professor.email, ...email });
      } catch (err) {
        if (err instanceof EmailNotConfiguredError) {
          res.status(503).json({ error: "O envio de e-mail não está configurado no servidor. Avise o administrador do sistema." });
          return;
        }
        console.error("[e-mail] falha ao enviar solicitação de reunião:", err instanceof EmailDeliveryError ? err.message : err);
        res.status(502).json({
          error: "Não foi possível enviar o e-mail ao aluno agora. Nada foi registrado; tente novamente em alguns minutos.",
        });
        return;
      }

      const scheduleLine = proposed
        ? `📅 Reunião solicitada por ${professorName}: ${proposed.label}${location ? ` — Local: ${location}` : ""}`
        : null;

      db.transaction(() => {
        db.prepare(
          `INSERT INTO meeting_requests (project_id, professor_id, student_id, sent_to, message, proposed_at, location)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(projectId, user.userId, project.student_id, project.student_email, message, parse.data.proposed_at || null, location);

        if (scheduleLine) {
          db.prepare(
            `UPDATE projects
             SET schedule = CASE WHEN TRIM(COALESCE(schedule, '')) = '' THEN ? ELSE schedule || char(10) || ? END,
                 updated_at = datetime('now')
             WHERE id = ?`
          ).run(scheduleLine, scheduleLine, projectId);
        }

        addHistory(
          projectId,
          user.userId,
          "reuniao",
          `${professorName} solicitou uma reunião por e-mail${proposed ? ` para ${proposed.label}` : ""}.`
        );
        addNotification(
          project.student_id,
          projectId,
          `${professorName} solicitou uma reunião sobre o projeto '${project.title}'${proposed ? ` (sugestão: ${proposed.label})` : ""}. Verifique seu e-mail e responda a ele.`,
          "info"
        );
      })();

      const body: MeetingRequestResponse = {
        message: `Solicitação de reunião enviada para ${project.student_email}.`,
        sentTo: project.student_email,
        nextAllowedAt: new Date(Date.now() + COOLDOWN_SECONDS * 1000).toISOString(),
        scheduleUpdated: Boolean(scheduleLine),
      };
      res.status(201).json(body);
    } finally {
      inFlight.delete(lockKey);
    }
  }
);

export default router;
