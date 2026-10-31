import type {
  AuthResponse,
  CreateEvaluationRequest,
  Evaluation,
  EvaluationStats,
  MeetingRequestBody,
  MeetingRequestResponse,
  Notification,
  Project,
  RegisterRequest,
  User,
} from "@shared/api";

const BASE_URL = "/api";

export const TOKEN_KEY = "sisapa_token";

// Fired when an authenticated request gets 401 (expired/invalid token); AuthContext logs out
export const SESSION_EXPIRED_EVENT = "sisapa:session-expired";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Every API call goes through here: adds the JWT, turns errors into ApiError
// and ends the session when an authenticated request is rejected with 401.
async function send(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();

  const headers: HeadersInit = {
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
    if (res.status === 401 && token) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(message, res.status);
  }

  return res;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await send(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
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

export async function register(data: RegisterRequest): Promise<AuthResponse> {
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

export async function requestMeeting(id: number, data: MeetingRequestBody): Promise<MeetingRequestResponse> {
  return request<MeetingRequestResponse>(`/projetos/${id}/reuniao`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Evaluations ──

export async function createEvaluation(data: CreateEvaluationRequest): Promise<Evaluation> {
  return request<Evaluation>("/avaliacoes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getEvaluationStats(): Promise<EvaluationStats> {
  return request<EvaluationStats>("/avaliacoes/stats");
}

// ── Files ──

export async function uploadFiles(
  projectId: number,
  files: FileList | File[]
): Promise<{ files: Array<{ id: number; original_name: string; size: number; mime_type: string }> }> {
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append("files", f));

  // No Content-Type header: the browser sets the multipart boundary
  const res = await send(`/files/upload/${projectId}`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

// Downloads with the Authorization header (a plain <a href> can't send it) and saves the file
export async function downloadAttachment(attachmentId: number, filename: string): Promise<void> {
  const res = await send(`/files/${attachmentId}/download`);
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
