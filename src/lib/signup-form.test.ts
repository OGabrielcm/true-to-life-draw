import { describe, expect, it } from "vitest";
import { validateSignupForm } from "./signup-form";

describe("validateSignupForm", () => {
  it("aceita nome, email confirmado e senha confirmada", () => {
    const result = validateSignupForm({
      fullName: "  Gabriel Mercês  ",
      email: "  merces@example.com ",
      emailConfirmation: "merces@example.com",
      password: "senha123",
      passwordConfirmation: "senha123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.fullName).toBe("Gabriel Mercês");
      expect(result.data.email).toBe("merces@example.com");
      expect(result.data.password).toBe("senha123");
    }
  });

  it("rejeita nome vazio", () => {
    const result = validateSignupForm({
      fullName: " ",
      email: "merces@example.com",
      emailConfirmation: "merces@example.com",
      password: "senha123",
      passwordConfirmation: "senha123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/nome/i);
  });

  it("rejeita confirmação de email diferente", () => {
    const result = validateSignupForm({
      fullName: "Gabriel Mercês",
      email: "merces@example.com",
      emailConfirmation: "outro@example.com",
      password: "senha123",
      passwordConfirmation: "senha123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/email não confere/i);
  });

  it("rejeita confirmação de senha diferente", () => {
    const result = validateSignupForm({
      fullName: "Gabriel Mercês",
      email: "merces@example.com",
      emailConfirmation: "merces@example.com",
      password: "senha123",
      passwordConfirmation: "outra123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/senha não confere/i);
  });
});
