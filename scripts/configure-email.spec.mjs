import { describe, expect, it } from "vitest";
import { emailConfigValues, isEmailConfigured, parseEnv, setEnvValues } from "./configure-email.mjs";

const EXAMPLE = [
  "# comentário",
  "JWT_SECRET=",
  "SMTP_HOST=smtp.gmail.com",
  "SMTP_PORT=465",
  "SMTP_SECURE=true",
  "SMTP_USER=",
  "SMTP_PASS=",
  "MAIL_FROM=",
  "EMAIL_REDIRECT_TO=",
  "",
].join("\n");

describe("configuração de e-mail no .env", () => {
  it("detecta quando falta usuário ou senha", () => {
    expect(isEmailConfigured(EXAMPLE)).toBe(false);
    expect(isEmailConfigured("SMTP_USER=a@gmail.com\nSMTP_PASS=")).toBe(false);
    expect(isEmailConfigured("SMTP_USER=a@gmail.com\nSMTP_PASS=abcdabcdabcdabcd")).toBe(true);
  });

  it("preenche as variáveis sem mexer nas outras linhas", () => {
    const values = emailConfigValues(EXAMPLE, {
      user: "sisapa@gmail.com",
      pass: "abcd efgh ijkl mnop",
      redirectTo: "eu@gmail.com",
    });
    const result = setEnvValues(EXAMPLE, values);
    const env = parseEnv(result);

    expect(env.SMTP_USER).toBe("sisapa@gmail.com");
    expect(env.SMTP_PASS).toBe("abcdefghijklmnop"); // espaços da senha de app removidos
    expect(env.MAIL_FROM).toBe("SISAPA <sisapa@gmail.com>");
    expect(env.EMAIL_REDIRECT_TO).toBe("eu@gmail.com");
    expect(result).toContain("# comentário");
    expect(result.split("\n").filter((l) => l.startsWith("SMTP_USER=")).length).toBe(1);
    expect(result.endsWith("\n")).toBe(true);
  });

  it("acrescenta host/porta do Gmail quando o .env não tem essas linhas", () => {
    const result = setEnvValues("PORT=3000\n", emailConfigValues("PORT=3000\n", { user: "x@gmail.com", pass: "p" }));
    const env = parseEnv(result);
    expect(env.SMTP_HOST).toBe("smtp.gmail.com");
    expect(env.SMTP_PORT).toBe("465");
    expect(env.PORT).toBe("3000");
    expect(env.EMAIL_REDIRECT_TO).toBe("");
  });

  it("preserva quebras de linha do Windows (CRLF)", () => {
    const crlf = EXAMPLE.replace(/\n/g, "\r\n");
    const result = setEnvValues(crlf, { SMTP_USER: "a@gmail.com" });
    expect(result).toContain("SMTP_USER=a@gmail.com\r\n");
    expect(result).not.toMatch(/[^\r]\n/);
  });
});
