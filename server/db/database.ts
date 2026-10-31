import Database from "better-sqlite3";
import path from "path";
import bcryptjs from "bcryptjs";

// SISAPA_DB_PATH lets tests use a throwaway database
const DB_PATH = path.resolve(process.env.SISAPA_DB_PATH || path.join(process.cwd(), "sisapa.db"));

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

// v1: original schema. Applied migrations must never be edited — append a new one instead.
const SCHEMA_V1 = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      cpf TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('aluno', 'professor')),
      matricula TEXT,
      curso TEXT,
      semestre INTEGER,
      siape TEXT,
      departamento TEXT,
      authorized INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      objectives TEXT NOT NULL DEFAULT '',
      impact TEXT DEFAULT '',
      public_target TEXT DEFAULT '',
      schedule TEXT DEFAULT '',
      resources TEXT DEFAULT '',
      area TEXT DEFAULT '',
      keywords TEXT DEFAULT '[]',
      proposal_type TEXT DEFAULT '',
      duration TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'rascunho'
        CHECK (status IN ('rascunho','submetido','em_analise','ajustes_solicitados','aprovado','reprovado')),
      progress INTEGER NOT NULL DEFAULT 0,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      professor_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      filepath TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      mime_type TEXT DEFAULT '',
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      professor_id INTEGER NOT NULL REFERENCES users(id),
      opinion TEXT DEFAULT '',
      feedback TEXT DEFAULT '',
      decision TEXT NOT NULL CHECK (decision IN ('aprovado','reprovado','ajustes_solicitados')),
      justification TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      type TEXT NOT NULL CHECK (type IN ('criacao','submissao','avaliacao','ajuste','notificacao')),
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id),
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
`;

// Text used to be HTML-escaped on input (sanitizeString); React already escapes on output.
const UNESCAPE_SQL = (col: string) =>
  `REPLACE(REPLACE(REPLACE(REPLACE(${col}, '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#x27;', '''')`;

function unescapeHtml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

// v2: notifications follow their project on delete, indexes for the common filters,
// and cleanup of text stored HTML-escaped by older versions.
function migrateV2(db: Database.Database): void {
  db.exec(`
    CREATE TABLE notifications_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO notifications_v2 (id, user_id, project_id, message, type, read, created_at)
      SELECT id, user_id, project_id, message, type, read, created_at FROM notifications;
    DROP TABLE notifications;
    ALTER TABLE notifications_v2 RENAME TO notifications;

    CREATE INDEX IF NOT EXISTS idx_projects_student ON projects(student_id);
    CREATE INDEX IF NOT EXISTS idx_projects_professor_status ON projects(professor_id, status);
    CREATE INDEX IF NOT EXISTS idx_attachments_project ON attachments(project_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_project ON evaluations(project_id);
    CREATE INDEX IF NOT EXISTS idx_history_project ON history(project_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
  `);

  const textColumns: Record<string, string[]> = {
    users: ["name"],
    projects: ["title", "description", "objectives", "impact", "public_target", "schedule", "resources", "area", "proposal_type", "duration"],
    evaluations: ["opinion", "feedback", "justification"],
    history: ["description"],
    notifications: ["message"],
  };
  for (const [table, cols] of Object.entries(textColumns)) {
    db.exec(`UPDATE ${table} SET ${cols.map((c) => `${c} = ${UNESCAPE_SQL(c)}`).join(", ")}`);
  }

  // keywords is a JSON array: decode each item, not the raw JSON text
  const rows = db.prepare("SELECT id, keywords FROM projects WHERE keywords LIKE '%&%'").all() as { id: number; keywords: string }[];
  const update = db.prepare("UPDATE projects SET keywords = ? WHERE id = ?");
  for (const row of rows) {
    try {
      const list = JSON.parse(row.keywords) as string[];
      update.run(JSON.stringify(list.map(unescapeHtml)), row.id);
    } catch {
      // leave malformed values untouched
    }
  }
}

// v3: meeting requests sent by e-mail (audit + rate limit) and the 'reuniao' history type.
// SQLite can't alter a CHECK constraint, so history is rebuilt keeping its rows.
function migrateV3(db: Database.Database): void {
  db.exec(`
    CREATE TABLE history_v3 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      type TEXT NOT NULL CHECK (type IN ('criacao','submissao','avaliacao','ajuste','notificacao','reuniao')),
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO history_v3 (id, project_id, user_id, type, description, created_at)
      SELECT id, project_id, user_id, type, description, created_at FROM history;
    DROP TABLE history;
    ALTER TABLE history_v3 RENAME TO history;
    CREATE INDEX IF NOT EXISTS idx_history_project ON history(project_id);

    CREATE TABLE meeting_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      professor_id INTEGER NOT NULL REFERENCES users(id),
      student_id INTEGER NOT NULL REFERENCES users(id),
      sent_to TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      proposed_at TEXT,
      location TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_meeting_requests_project_professor
      ON meeting_requests(project_id, professor_id, created_at);
  `);
}

// Index i upgrades the schema to version i + 1 (tracked in PRAGMA user_version).
const MIGRATIONS: ((db: Database.Database) => void)[] = [
  (db) => db.exec(SCHEMA_V1),
  migrateV2,
  migrateV3,
];

function migrate(db: Database.Database): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.transaction(() => {
      MIGRATIONS[version](db);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
}

export function initDb(): void {
  const db = getDb();
  migrate(db);

  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number };

  // Demo data with a known password: only for development, or when explicitly requested
  const seedAllowed = process.env.NODE_ENV !== "production" || process.env.SEED === "1";
  if (count === 0 && seedAllowed) {
    db.transaction(() => seedData(db))();
  }
}

function seedData(db: Database.Database): void {
  const hash = (pw: string) => bcryptjs.hashSync(pw, 12);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, cpf, password_hash, role, matricula, curso, semestre, siape, departamento, authorized)
    VALUES (@name, @email, @cpf, @password_hash, @role, @matricula, @curso, @semestre, @siape, @departamento, @authorized)
  `);

  const student1 = insertUser.run({
    name: "João da Silva",
    email: "joao.silva@estudante.ifms.edu.br",
    cpf: "12345678901",
    password_hash: hash("senha123"),
    role: "aluno",
    matricula: "2023001",
    curso: "Tecnologia em Análise e Desenvolvimento de Sistemas",
    semestre: 4,
    siape: null,
    departamento: null,
    authorized: 1,
  });

  const student2 = insertUser.run({
    name: "Maria Oliveira",
    email: "maria.oliveira@estudante.ifms.edu.br",
    cpf: "98765432100",
    password_hash: hash("senha123"),
    role: "aluno",
    matricula: "2023002",
    curso: "Técnico em Informática",
    semestre: 3,
    siape: null,
    departamento: null,
    authorized: 1,
  });

  const prof1 = insertUser.run({
    name: "Prof. Ana Costa",
    email: "ana.costa@ifms.edu.br",
    cpf: "11122233344",
    password_hash: hash("senha123"),
    role: "professor",
    matricula: null,
    curso: null,
    semestre: null,
    siape: "1234567",
    departamento: "Tecnologia da Informação",
    authorized: 1,
  });

  const prof2 = insertUser.run({
    name: "Prof. Carlos Lima",
    email: "carlos.lima@ifms.edu.br",
    cpf: "55566677788",
    password_hash: hash("senha123"),
    role: "professor",
    matricula: null,
    curso: null,
    semestre: null,
    siape: "7654321",
    departamento: "Ciências Exatas",
    authorized: 1,
  });

  const insertProject = db.prepare(`
    INSERT INTO projects (title, description, objectives, impact, public_target, schedule, resources, area, keywords, proposal_type, duration, status, progress, student_id, professor_id)
    VALUES (@title, @description, @objectives, @impact, @public_target, @schedule, @resources, @area, @keywords, @proposal_type, @duration, @status, @progress, @student_id, @professor_id)
  `);

  const proj1 = insertProject.run({
    title: "Projeto de Alfabetização Digital para Idosos",
    description: "Projeto de extensão para ensinar tecnologias digitais para a terceira idade na comunidade local.",
    objectives: "Capacitar idosos a usar smartphones, internet e serviços digitais básicos.",
    impact: "Inclusão digital de pelo menos 50 idosos no primeiro semestre.",
    public_target: "Idosos acima de 60 anos da comunidade do bairro Centro.",
    schedule: "6 meses, com encontros semanais às terças-feiras.",
    resources: "Laboratório de informática, voluntários, material didático impresso.",
    area: "Educação",
    keywords: JSON.stringify(["inclusão digital", "idosos", "tecnologia", "extensão"]),
    proposal_type: "Projeto de extensão",
    duration: "6 meses",
    status: "aprovado",
    progress: 100,
    student_id: student1.lastInsertRowid,
    professor_id: prof1.lastInsertRowid,
  });

  const proj2 = insertProject.run({
    title: "Horta Comunitária Sustentável",
    description: "Implantação de horta orgânica comunitária para promover alimentação saudável.",
    objectives: "Criar espaço de cultivo sustentável para a comunidade escolar.",
    impact: "Fornecimento de alimentos orgânicos para cantina escolar e famílias.",
    public_target: "Alunos e famílias de escola pública parceira.",
    schedule: "8 meses, com atividades práticas mensais.",
    resources: "Área externa da escola, sementes, ferramentas de jardinagem.",
    area: "Meio Ambiente",
    keywords: JSON.stringify(["sustentabilidade", "horta", "alimentação saudável"]),
    proposal_type: "Projeto de extensão",
    duration: "8 meses",
    status: "em_analise",
    progress: 60,
    student_id: student1.lastInsertRowid,
    professor_id: prof2.lastInsertRowid,
  });

  const proj3 = insertProject.run({
    title: "Aplicativo de Mobilidade Urbana",
    description: "Desenvolvimento de app para otimizar rotas de transporte público na cidade.",
    objectives: "Criar solução mobile para facilitar o uso do transporte coletivo.",
    impact: "Redução do tempo de espera e melhora na mobilidade urbana.",
    public_target: "Usuários de transporte público da cidade.",
    schedule: "12 meses de desenvolvimento.",
    resources: "Equipe de desenvolvimento, servidores, dados abertos de transporte.",
    area: "Tecnologia",
    keywords: JSON.stringify(["mobilidade", "transporte público", "app", "cidade"]),
    proposal_type: "Pesquisa",
    duration: "12 meses",
    status: "ajustes_solicitados",
    progress: 40,
    student_id: student1.lastInsertRowid,
    professor_id: prof1.lastInsertRowid,
  });

  const proj4 = insertProject.run({
    title: "Programa de Saúde Comunitária",
    description: "Ações de saúde preventiva em comunidades carentes.",
    objectives: "Promover saúde bucal e vacinas em comunidades vulneráveis.",
    impact: "Atendimento de 200 famílias no primeiro mês.",
    public_target: "Comunidades de baixa renda.",
    schedule: "4 meses, com mutirões mensais.",
    resources: "Parceria com UBS, voluntários de medicina, materiais básicos.",
    area: "Saúde",
    keywords: JSON.stringify(["saúde", "comunidade", "prevenção"]),
    proposal_type: "Projeto de extensão",
    duration: "4 meses",
    status: "submetido",
    progress: 10,
    student_id: student2.lastInsertRowid,
    professor_id: null,
  });

  const insertEval = db.prepare(`
    INSERT INTO evaluations (project_id, professor_id, opinion, feedback, decision, justification)
    VALUES (@project_id, @professor_id, @opinion, @feedback, @decision, @justification)
  `);

  insertEval.run({
    project_id: proj1.lastInsertRowid,
    professor_id: prof1.lastInsertRowid,
    opinion: "Proposta excelente com metodologia bem definida.",
    feedback: "Excelente proposta! O projeto demonstra grande potencial de impacto social.",
    decision: "aprovado",
    justification: "",
  });

  insertEval.run({
    project_id: proj3.lastInsertRowid,
    professor_id: prof1.lastInsertRowid,
    opinion: "Projeto com boa base técnica, mas documentação incompleta.",
    feedback: "O projeto tem boa base, mas precisa de uma documentação mais detalhada sobre a metodologia de coleta de dados.",
    decision: "ajustes_solicitados",
    justification: "A proposta não detalha adequadamente o cronograma de coleta de dados nem os critérios de validação do aplicativo.",
  });

  const insertHistory = db.prepare(`
    INSERT INTO history (project_id, user_id, type, description) VALUES (@project_id, @user_id, @type, @description)
  `);

  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, project_id, message, type) VALUES (@user_id, @project_id, @message, @type)
  `);
  
  // adicionando notificações manualmente

  insertHistory.run({ project_id: proj1.lastInsertRowid, user_id: student1.lastInsertRowid, type: "criacao", description: "Projeto criado." });
  insertHistory.run({ project_id: proj1.lastInsertRowid, user_id: student1.lastInsertRowid, type: "submissao", description: "Projeto submetido para avaliação." });
  insertHistory.run({ project_id: proj1.lastInsertRowid, user_id: prof1.lastInsertRowid, type: "avaliacao", description: "Projeto avaliado e aprovado." });

  insertHistory.run({ project_id: proj2.lastInsertRowid, user_id: student1.lastInsertRowid, type: "criacao", description: "Projeto criado." });
  insertHistory.run({ project_id: proj2.lastInsertRowid, user_id: student1.lastInsertRowid, type: "submissao", description: "Projeto submetido para avaliação." });

  insertHistory.run({ project_id: proj3.lastInsertRowid, user_id: student1.lastInsertRowid, type: "criacao", description: "Projeto criado." });
  insertHistory.run({ project_id: proj3.lastInsertRowid, user_id: student1.lastInsertRowid, type: "submissao", description: "Projeto submetido para avaliação." });
  insertHistory.run({ project_id: proj3.lastInsertRowid, user_id: prof1.lastInsertRowid, type: "avaliacao", description: "Ajustes solicitados pelo professor." });

  insertHistory.run({ project_id: proj4.lastInsertRowid, user_id: student2.lastInsertRowid, type: "criacao", description: "Projeto criado." });
  insertHistory.run({ project_id: proj4.lastInsertRowid, user_id: student2.lastInsertRowid, type: "submissao", description: "Projeto submetido para avaliação." });

  insertNotif.run({ user_id: student1.lastInsertRowid, project_id: proj1.lastInsertRowid, message: "Seu projeto 'Alfabetização Digital para Idosos' foi aprovado!", type: "success" });
  insertNotif.run({ user_id: student1.lastInsertRowid, project_id: proj3.lastInsertRowid, message: "Ajustes foram solicitados no projeto 'Aplicativo de Mobilidade Urbana'.", type: "warning" });
  insertNotif.run({ user_id: prof1.lastInsertRowid, project_id: proj2.lastInsertRowid, message: "Novo projeto 'Horta Comunitária Sustentável' aguarda sua avaliação.", type: "info" });
  insertNotif.run({ user_id: prof2.lastInsertRowid, project_id: proj2.lastInsertRowid, message: "Novo projeto 'Horta Comunitária Sustentável' foi atribuído a você.", type: "info" });
}
