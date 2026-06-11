import { Router, Request, Response } from "express";
import { getDb } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/notificacoes
router.get("/", requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const user = req.user!;

  const notifications = db
    .prepare(
      `SELECT n.*, p.title as project_title
       FROM notifications n
       LEFT JOIN projects p ON n.project_id = p.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`
    )
    .all(user.userId);

  const unreadCount = (
    db
      .prepare("SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0")
      .get(user.userId) as any
  ).c;

  res.json({ notifications, unreadCount });
});

// PUT /api/notificacoes/:id/read
router.put("/:id/read", requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const { id } = req.params;
  const user = req.user!;

  const notif = db
    .prepare("SELECT * FROM notifications WHERE id = ? AND user_id = ?")
    .get(id, user.userId);

  if (!notif) {
    res.status(404).json({ error: "Notificação não encontrada." });
    return;
  }

  db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
  res.json({ message: "Notificação marcada como lida." });
});

// PUT /api/notificacoes/read-all
router.put("/read-all", requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const user = req.user!;

  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(user.userId);
  res.json({ message: "Todas as notificações marcadas como lidas." });
});

// DELETE /api/notificacoes/:id
router.delete("/:id", requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const { id } = req.params;
  const user = req.user!;

  const notif = db
    .prepare("SELECT * FROM notifications WHERE id = ? AND user_id = ?")
    .get(id, user.userId);

  if (!notif) {
    res.status(404).json({ error: "Notificação não encontrada." });
    return;
  }

  db.prepare("DELETE FROM notifications WHERE id = ?").run(id);
  res.json({ message: "Notificação removida." });
});

export default router;
