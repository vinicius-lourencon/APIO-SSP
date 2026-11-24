import { ApiError } from "./api";

// Só 401 (token inválido) e 404 (usuário removido) encerram a sessão; 429, 5xx e falha de rede são temporários
export function isSessionInvalid(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 404);
}

export function sessionErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Não foi possível falar com o servidor. Verifique sua conexão.";
}
