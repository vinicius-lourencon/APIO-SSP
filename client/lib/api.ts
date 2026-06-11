import type { AuthResponse, Project, Evaluation, Notification, User } from "@shared/api";

const BASE_URL = "/api";

function getToken(): string | null {
  return localStorage.getItem("sisapa_token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Auth ──

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
  role: "aluno" | "professor";
  cpf?: string;
  matricula?: string;
  curso?: string;
  semestre?: number;
  siape?: string;
  departamento?: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

// ── Projects ──

export async function getProjects(params?: {
  status?: string;
  search?: string;
}): Promise<Project[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString() ? `?${qs}` : "";
  return request<Project[]>(`/projetos${query}`);
}

export async function getProject(id: number): Promise<Project> {
  return request<Project>(`/projetos/${id}`);
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  return request<Project>("/projetos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: number, data: Partial<Project>): Promise<Project> {
  return request<Project>(`/projetos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function submitProject(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/projetos/${id}/submit`, {
    method: "POST",
  });
}

export async function assignProject(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/projetos/${id}/assign`, {
    method: "POST",
  });
}

export async function deleteProject(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/projetos/${id}`, {
    method: "DELETE",
  });
}

// ── Evaluations ──

export async function createEvaluation(data: {
  project_id: number;
  opinion: string;
  feedback: string;
  decision: "aprovado" | "reprovado" | "ajustes_solicitados";
  justification?: string;
}): Promise<Evaluation> {
  return request<Evaluation>("/avaliacoes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getEvaluationStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  adjustments: number;
}> {
  return request("/avaliacoes/stats");
}

// ── Files ──

export async function uploadFiles(
  projectId: number,
  files: FileList | File[]
): Promise<{ files: Array<{ id: number; original_name: string; size: number; mime_type: string }> }> {
  const token = getToken();
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append("files", f));

  const res = await fetch(`${BASE_URL}/files/upload/${projectId}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || "Falha no upload.", res.status);
  }
  return res.json();
}

export function getDownloadUrl(attachmentId: number): string {
  return `${BASE_URL}/files/${attachmentId}/download`;
}

export async function deleteAttachment(attachmentId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/files/${attachmentId}`, {
    method: "DELETE",
  });
}

// ── Notifications ──

export async function getNotifications(): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> {
  return request("/notificacoes");
}

export async function markNotificationRead(id: number): Promise<{ message: string }> {
  return request(`/notificacoes/${id}/read`, { method: "PUT" });
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return request("/notificacoes/read-all", { method: "PUT" });
}

export async function deleteNotification(id: number): Promise<{ message: string }> {
  return request(`/notificacoes/${id}`, { method: "DELETE" });
}
