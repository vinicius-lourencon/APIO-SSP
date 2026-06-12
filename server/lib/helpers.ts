import { getDb } from "../db/database.js";

export function addHistory(
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

export function addNotification(
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
