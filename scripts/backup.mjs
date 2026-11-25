// Backs up the SQLite database and the uploads folder into backups/AAAA-MM-DD_HH-MM-SS/.
// Safe while the server is running (uses SQLite's online backup, which handles the WAL file).
// Keeps the newest KEEP_BACKUPS folders. Run manually with: pnpm backup
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KEEP_BACKUPS = 10;

/** Folder name for a backup taken at `date` (local time, sorts chronologically). */
export function backupFolderName(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_` +
    `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

/** Backup folders to delete so only the newest `keep` remain. */
export function foldersToPrune(names, keep = KEEP_BACKUPS) {
  const backups = names.filter((n) => /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(n)).sort();
  return backups.slice(0, Math.max(0, backups.length - keep));
}

/**
 * Copies the database and uploads. Returns the backup folder, or null when there is no database yet.
 * Paths follow the same variables as the server (SISAPA_DB_PATH, SISAPA_UPLOADS_DIR).
 */
export async function backup({
  dbPath = path.resolve(process.env.SISAPA_DB_PATH || path.join(ROOT, "sisapa.db")),
  uploadsDir = path.resolve(process.env.SISAPA_UPLOADS_DIR || path.join(ROOT, "uploads")),
  backupsDir = path.join(ROOT, "backups"),
  now = new Date(),
} = {}) {
  if (!fs.existsSync(dbPath)) return null;

  const target = path.join(backupsDir, backupFolderName(now));
  fs.mkdirSync(target, { recursive: true });

  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    await db.backup(path.join(target, "sisapa.db"));
  } finally {
    db.close();
  }
  if (fs.existsSync(uploadsDir)) {
    fs.cpSync(uploadsDir, path.join(target, "uploads"), { recursive: true });
  }

  for (const old of foldersToPrune(fs.readdirSync(backupsDir))) {
    fs.rmSync(path.join(backupsDir, old), { recursive: true, force: true });
  }
  return target;
}

// Run only when executed directly (not when imported)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  backup()
    .then((target) => {
      if (target) console.log(`Backup salvo em ${path.relative(ROOT, target)}`);
      else console.log("Nada para salvar: o banco sisapa.db ainda não existe.");
    })
    .catch((err) => {
      console.error("Erro no backup:", err?.message ?? err);
      process.exitCode = 1;
    });
}
