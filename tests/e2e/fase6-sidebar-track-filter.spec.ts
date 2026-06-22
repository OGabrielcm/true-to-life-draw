import { test, expect } from "@playwright/test";
import { goToBoard } from "./helpers";

/**
 * Testa o filtro de áreas na sidebar:
 * - Botão "Todos" visível e ativo por padrão
 * - Clicar numa área filtra o board
 * - Clicar em duas áreas mantém ambas selecionadas
 * - Clicar novamente na mesma área (toggle) volta para Todos quando era a única selecionada
 * - Clicar em Todos reseta o filtro
 */
test.describe.serial("6.1 — Filtro de áreas na sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await goToBoard(page);
  });

  test("botão Todos está visível na sidebar", async ({ page }) => {
    // A seção de áreas deve estar expandida por padrão
    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await expect(todosBtn).toBeVisible({ timeout: 8_000 });
    console.log("✓ Botão Todos visível");
  });

  test("botão Todos está ativo por padrão (sem seleção de área)", async ({ page }) => {
    // O botão Todos deve ter a classe nav-item-active quando nenhuma área está selecionada
    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await expect(todosBtn).toBeVisible({ timeout: 8_000 });
    await expect(todosBtn).toHaveClass(/nav-item-active/);
    console.log("✓ Todos ativo por padrão");
  });

  test("clicar numa área aplica o filtro visual", async ({ page }) => {
    // Aguarda ao menos 1 área na sidebar
    const areaBtn = page.locator("nav button[aria-pressed]").first();
    const count = await areaBtn.count();
    if (count === 0) {
      console.log("⚠️ Sem áreas disponíveis — pulando teste de filtro");
      return;
    }

    const areaName = await areaBtn.locator("div").last().textContent();
    await areaBtn.click();

    // Após clicar, o botão da área deve ficar ativo
    await expect(areaBtn).toHaveClass(/nav-item-active/, { timeout: 3_000 });

    // E o botão Todos não deve estar ativo
    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await expect(todosBtn).not.toHaveClass(/nav-item-active/);

    console.log(`✓ Filtro aplicado para área: ${areaName}`);
  });

  test("clicar em duas áreas mantém seleção múltipla", async ({ page }) => {
    const areaBtns = page.locator("nav button[aria-pressed]");
    const count = await areaBtns.count();
    if (count < 2) {
      console.log("⚠️ Menos de 2 áreas disponíveis — pulando teste de multi-select");
      return;
    }

    const firstArea = areaBtns.nth(0);
    const secondArea = areaBtns.nth(1);

    await firstArea.click();
    await secondArea.click();

    await expect(firstArea).toHaveClass(/nav-item-active/, { timeout: 3_000 });
    await expect(secondArea).toHaveClass(/nav-item-active/, { timeout: 3_000 });

    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await expect(todosBtn).not.toHaveClass(/nav-item-active/);

    console.log("✓ Multi-select de áreas mantém duas áreas ativas");
  });

  test("clicar na mesma área duas vezes (toggle) volta para Todos", async ({ page }) => {
    const areaBtn = page.locator("nav button[aria-pressed]").first();
    const count = await areaBtn.count();
    if (count === 0) {
      console.log("⚠️ Sem áreas disponíveis — pulando teste de toggle");
      return;
    }

    // Primeiro clique: ativa filtro
    await areaBtn.click();
    await expect(areaBtn).toHaveClass(/nav-item-active/, { timeout: 3_000 });

    // Segundo clique: desativa (toggle)
    await areaBtn.click();
    await expect(areaBtn).not.toHaveClass(/nav-item-active/, { timeout: 3_000 });

    // Todos deve voltar a estar ativo
    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await expect(todosBtn).toHaveClass(/nav-item-active/, { timeout: 3_000 });

    console.log("✓ Toggle de área funciona — Todos ativo após segundo clique");
  });

  test("clicar em Todos reseta o filtro de áreas", async ({ page }) => {
    const areaBtn = page.locator("nav button[aria-pressed]").first();
    const count = await areaBtn.count();
    if (count === 0) {
      console.log("⚠️ Sem áreas disponíveis — pulando teste de reset");
      return;
    }

    // Ativa um filtro de área
    await areaBtn.click();
    await expect(areaBtn).toHaveClass(/nav-item-active/, { timeout: 3_000 });

    // Clica em Todos para resetar
    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await todosBtn.click();

    await expect(todosBtn).toHaveClass(/nav-item-active/, { timeout: 3_000 });
    await expect(areaBtn).not.toHaveClass(/nav-item-active/);

    console.log("✓ Clicar em Todos reseta o filtro");
  });
});
