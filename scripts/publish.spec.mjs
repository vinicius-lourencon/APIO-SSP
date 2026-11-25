import { afterAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { ensureJwtSecret, extractTunnelUrl } from "./publish.mjs";
import { backup, backupFolderName, foldersToPrune } from "./backup.mjs";

describe("publicação: segredo do JWT", () => {
  it("gera o segredo quando está vazio, sem mexer nas outras linhas", () => {
    const content = "# comentário\nJWT_SECRET=\nPORT=3000\n";
    const result = ensureJwtSecret(content, () => "abc123");
    expect(result.created).toBe(true);
    expect(result.content).toBe("# comentário\nJWT_SECRET=abc123\nPORT=3000\n");
  });

  it("acrescenta a variável quando ela não existe", () => {
    const result = ensureJwtSecret("PORT=3000\n", () => "abc123");
    expect(result.content).toContain("JWT_SECRET=abc123");
    expect(result.content).toContain("PORT=3000");
  });

  it("mantém um segredo já existente", () => {
    const content = "JWT_SECRET=ja-existe\n";
    expect(ensureJwtSecret(content, () => "novo")).toEqual({ content, created: false });
  });

  it("gera um segredo aleatório longo por padrão", () => {
    const a = ensureJwtSecret("").content;
    const b = ensureJwtSecret("").content;
    expect(a).toMatch(/^JWT_SECRET=[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe("publicação: link do túnel", () => {
  it("encontra o link no log do cloudflared", () => {
    const log = [
      "2026-11-24T12:00:00Z INF Requesting new quick Tunnel on trycloudflare.com...",
      "2026-11-24T12:00:02Z INF |  https://brave-lion-sample-words.trycloudflare.com  |",
    ].join("\n");
    expect(extractTunnelUrl(log)).toBe("https://brave-lion-sample-words.trycloudflare.com");
  });

  it("não confunde a mensagem inicial com o link", () => {
    expect(extractTunnelUrl("INF Requesting new quick Tunnel on trycloudflare.com...")).toBeNull();
  });
});

describe("backup", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sisapa-backup-"));
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it("nomeia as pastas em ordem cronológica", () => {
    expect(backupFolderName(new Date(2026, 10, 4, 9, 5, 7))).toBe("2026-11-04_09-05-07");
  });

  it("mantém só as mais recentes", () => {
    const names = ["2026-11-03_10-00-00", "2026-11-01_10-00-00", "2026-11-02_10-00-00", "outra-pasta"];
    expect(foldersToPrune(names, 2)).toEqual(["2026-11-01_10-00-00"]);
    expect(foldersToPrune(names, 5)).toEqual([]);
  });

  it("não faz nada sem banco", async () => {
    expect(await backup({ dbPath: path.join(tmp, "nao-existe.db"), backupsDir: path.join(tmp, "b0") })).toBeNull();
  });

  it("copia o banco (com WAL aberto) e os anexos", async () => {
    const dbPath = path.join(tmp, "sisapa.db");
    const uploadsDir = path.join(tmp, "uploads");
    fs.mkdirSync(uploadsDir);
    fs.writeFileSync(path.join(uploadsDir, "anexo.pdf"), "%PDF-1.4");

    // Connection left open, as when the server is running
    const live = new Database(dbPath);
    live.pragma("journal_mode = WAL");
    live.exec("CREATE TABLE t (v TEXT); INSERT INTO t VALUES ('ok');");

    const target = await backup({
      dbPath,
      uploadsDir,
      backupsDir: path.join(tmp, "backups"),
      now: new Date(2026, 10, 24, 12, 0, 0),
    });
    live.close();

    expect(target).toBe(path.join(tmp, "backups", "2026-11-24_12-00-00"));
    const copy = new Database(path.join(target, "sisapa.db"), { readonly: true });
    expect(copy.prepare("SELECT v FROM t").get()).toEqual({ v: "ok" });
    copy.close();
    expect(fs.readFileSync(path.join(target, "uploads", "anexo.pdf"), "utf8")).toBe("%PDF-1.4");
  });
});
