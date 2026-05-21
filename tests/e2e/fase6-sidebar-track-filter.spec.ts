import { test, expect } from "@playwright/test";
import { goToBoard, RUN_ID } from "./helpers";

/**
 * Testa o filtro de trilha na sidebar:
 * - Botão "Todos" visível e ativo por padrão
 * - Clicar numa trilha filtra o board
 * - Clicar novamente na mesma trilha (toggle) volta para Todos
 * - Clicar em Todos reseta o filtro
 */
test.describe.serial("6.1 — Filtro de trilha na sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await goToBoard(page);
  });

  test("botão Todos está visível na sidebar", async ({ page }) => {
    // A seção de trilhas deve estar expandida por padrão
    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await expect(todosBtn).toBeVisible({ timeout: 8_000 });
    console.log("✓ Botão Todos visível");
  });

  test("botão Todos está ativo por padrão (sem seleção de trilha)", async ({ page }) => {
    // O botão Todos deve ter a classe nav-item-active quando nenhuma trilha está selecionada
    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await expect(todosBtn).toBeVisible({ timeout: 8_000 });
    await expect(todosBtn).toHaveClass(/nav-item-active/);
    console.log("✓ Todos ativo por padrão");
  });

  test("clicar numa trilha aplica o filtro visual", async ({ page }) => {
    // Aguarda ao menos 1 trilha na sidebar
    const trackBtn = page.locator("nav button[aria-pressed]").first();
    const count = await trackBtn.count();
    if (count === 0) {
      console.log("⚠️ Sem trilhas disponíveis — pulando teste de filtro");
      return;
    }

    const trackName = await trackBtn.locator("div").last().textContent();
    await trackBtn.click();

    // Após clicar, o botão da trilha deve ficar ativo
    await expect(trackBtn).toHaveClass(/nav-item-active/, { timeout: 3_000 });

    // E o botão Todos não deve estar ativo
    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await expect(todosBtn).not.toHaveClass(/nav-item-active/);

    console.log(`✓ Filtro aplicado para trilha: ${trackName}`);
  });

  test("clicar na mesma trilha duas vezes (toggle) volta para Todos", async ({ page }) => {
    const trackBtn = page.locator("nav button[aria-pressed]").first();
    const count = await trackBtn.count();
    if (count === 0) {
      console.log("⚠️ Sem trilhas disponíveis — pulando teste de toggle");
      return;
    }

    // Primeiro clique: ativa filtro
    await trackBtn.click();
    await expect(trackBtn).toHaveClass(/nav-item-active/, { timeout: 3_000 });

    // Segundo clique: desativa (toggle)
    await trackBtn.click();
    await expect(trackBtn).not.toHaveClass(/nav-item-active/, { timeout: 3_000 });

    // Todos deve voltar a estar ativo
    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await expect(todosBtn).toHaveClass(/nav-item-active/, { timeout: 3_000 });

    console.log("✓ Toggle de trilha funciona — Todos ativo após segundo clique");
  });

  test("clicar em Todos reseta o filtro de trilha", async ({ page }) => {
    const trackBtn = page.locator("nav button[aria-pressed]").first();
    const count = await trackBtn.count();
    if (count === 0) {
      console.log("⚠️ Sem trilhas disponíveis — pulando teste de reset");
      return;
    }

    // Ativa um filtro de trilha
    await trackBtn.click();
    await expect(trackBtn).toHaveClass(/nav-item-active/, { timeout: 3_000 });

    // Clica em Todos para resetar
    const todosBtn = page.locator("nav button").filter({ hasText: /^Todos$/ });
    await todosBtn.click();

    await expect(todosBtn).toHaveClass(/nav-item-active/, { timeout: 3_000 });
    await expect(trackBtn).not.toHaveClass(/nav-item-active/);

    console.log("✓ Clicar em Todos reseta o filtro");
  });
});
