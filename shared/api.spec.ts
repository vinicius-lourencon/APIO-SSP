import { describe, expect, it } from "vitest";
import { firstName, professorLabel } from "./api";

describe("professorLabel", () => {
  it("adiciona o título sem duplicar", () => {
    expect(professorLabel("Ana Costa")).toBe("Prof. Ana Costa");
    expect(professorLabel("Prof. Ana Costa")).toBe("Prof. Ana Costa");
    expect(professorLabel("Profa. Maria Lima")).toBe("Prof. Maria Lima");
    expect(professorLabel("  professor Carlos  ")).toBe("Prof. Carlos");
  });

  it("não confunde nomes que começam com 'Prof'", () => {
    expect(professorLabel("Profeta Silva")).toBe("Prof. Profeta Silva");
  });
});

describe("firstName", () => {
  it("retorna o primeiro nome sem título", () => {
    expect(firstName("Prof. Ana Costa")).toBe("Ana");
    expect(firstName("João da Silva")).toBe("João");
    expect(firstName("")).toBe("");
  });
});
