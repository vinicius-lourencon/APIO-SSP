import { describe, expect, it } from "vitest";
import { ApiError } from "./api";
import { isSessionInvalid, sessionErrorMessage } from "./session";

describe("restauração da sessão", () => {
  it("encerra a sessão quando o token é inválido ou o usuário não existe mais", () => {
    expect(isSessionInvalid(new ApiError("Token inválido ou expirado.", 401))).toBe(true);
    expect(isSessionInvalid(new ApiError("Usuário não encontrado.", 404))).toBe(true);
  });

  it("mantém a sessão em falhas temporárias", () => {
    for (const status of [429, 500, 502, 503]) {
      expect(isSessionInvalid(new ApiError("falha", status))).toBe(false);
    }
    expect(isSessionInvalid(new TypeError("Failed to fetch"))).toBe(false);
  });

  it("mostra a mensagem da API ou um aviso de conexão", () => {
    expect(sessionErrorMessage(new ApiError("Muitas requisições.", 429))).toBe("Muitas requisições.");
    expect(sessionErrorMessage(new TypeError("Failed to fetch"))).toContain("servidor");
  });
});
