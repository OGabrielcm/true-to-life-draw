import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateSignupForm } from "./signup-form.ts";

describe("validateSignupForm", () => {
  it("aceita nome, email confirmado e senha confirmada", () => {
    const result = validateSignupForm({
      fullName: "  Gabriel Mercês  ",
      email: "  merces@example.com ",
      emailConfirmation: "merces@example.com",
      password: "senha123",
      passwordConfirmation: "senha123",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.fullName, "Gabriel Mercês");
      assert.equal(result.data.email, "merces@example.com");
      assert.equal(result.data.password, "senha123");
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

    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /nome/i);
  });

  it("rejeita confirmação de email diferente", () => {
    const result = validateSignupForm({
      fullName: "Gabriel Mercês",
      email: "merces@example.com",
      emailConfirmation: "outro@example.com",
      password: "senha123",
      passwordConfirmation: "senha123",
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /email não confere/i);
  });

  it("rejeita confirmação de senha diferente", () => {
    const result = validateSignupForm({
      fullName: "Gabriel Mercês",
      email: "merces@example.com",
      emailConfirmation: "merces@example.com",
      password: "senha123",
      passwordConfirmation: "outra123",
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /senha não confere/i);
  });
});
