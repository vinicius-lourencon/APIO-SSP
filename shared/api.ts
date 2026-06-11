// Shared types between client and server

export type UserRole = "aluno" | "professor";

export type ProjectStatus =
  | "rascunho"
  | "submetido"
  | "em_analise"
  | "ajustes_solicitados"
  | "aprovado"
  | "reprovado";

export type EvaluationDecision = "aprovado" | "reprovado" | "ajustes_solicitados";

export type NotificationType = "info" | "success" | "warning" | "error";

export type HistoryType = "criacao" | "submissao" | "avaliacao" | "ajuste" | "notificacao";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  matricula?: string | null;
  curso?: string | null;
  semestre?: number | null;
  siape?: string | null;
  departamento?: string | null;
  created_at?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  objectives: string;
  impact: string;
  public_target: string;
  schedule: string;
  resources: string;
  area: string;
  keywords: string[];
  proposal_type: string;
  duration: string;
  status: ProjectStatus;
  progress: number;
  student_id: number;
  professor_id: number | null;
  student_name?: string;
  student_email?: string;
  professor_name?: string;
  attachment_count?: number;
  latest_feedback?: string | null;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
  evaluations?: Evaluation[];
  history?: HistoryEntry[];
}

export interface Attachment {
  id: number;
  project_id: number;
  filename: string;
  original_name: string;
  size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface Evaluation {
  id: number;
  project_id: number;
  professor_id: number;
  professor_name?: string;
  opinion: string;
  feedback: string;
  decision: EvaluationDecision;
  justification: string;
  created_at: string;
}

export interface HistoryEntry {
  id: number;
  project_id: number;
  user_id: number | null;
  user_name?: string | null;
  type: HistoryType;
  description: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  project_id: number | null;
  project_title?: string | null;
  message: string;
  type: NotificationType;
  read: 0 | 1;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  rascunho: "Rascunho",
  submetido: "Submetido",
  em_analise: "Em Análise",
  ajustes_solicitados: "Ajustes Solicitados",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

export const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  rascunho: { bg: "bg-gray-100", text: "text-gray-600" },
  submetido: { bg: "bg-blue-100", text: "text-blue-600" },
  em_analise: { bg: "bg-yellow-100", text: "text-yellow-700" },
  ajustes_solicitados: { bg: "bg-orange-100", text: "text-orange-600" },
  aprovado: { bg: "bg-green-100", text: "text-green-700" },
  reprovado: { bg: "bg-red-100", text: "text-red-600" },
};

export const PROPOSAL_TYPES = [
  "Congresso científico",
  "Projeto de extensão",
  "Pesquisa",
  "Curso",
  "Evento",
  "TCC",
];

export const KNOWLEDGE_AREAS = [
  "Tecnologia",
  "Educação",
  "Saúde",
  "Meio Ambiente",
  "Ciências Sociais",
  "Engenharia",
  "Artes",
  "Outro",
];

// Demo response kept for compatibility
export interface DemoResponse {
  message: string;
}
