import { test, expect } from "@playwright/test";
import { goToBoard, RUN_ID } from "./helpers";

/**
 * Testa a rota /settings:
 * - Acessível via sidebar (link Configurações)
 * - Exibe seções de Trilhas e Colunas padrão
 * - Botão Gerenciar abre o modal de trilhas
 * - Botão Gerenciar abre o modal de colunas padrão
 * - Acessível via menu do avatar
 */
test.describe.serial("6.2 — Rota /settings", () => {
  test("acessa /settings pela sidebar", async ({ page }) => {
    await goToBoard(page);

    // Link "Configurações" na nav
    const settingsLink = page.locator("nav a[href='/settings']");
    await expect(settingsLink).toBeVisible({ timeout: 8_000 });
    await settingsLink.click();

    await expect(page).toHaveURL(/\/settings/, { timeout: 8_000 });
    await expect(page.locator("h1").filter({ hasText: /Configurações/i })).toBeVisible({ timeout: 5_000 });

    console.log("✓ /settings acessível pela sidebar");
  });

  test("exibe seção de Trilhas com contagem", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h2").filter({ hasText: /Trilhas/i }).first()).toBeVisible({ timeout: 8_000 });

    // Deve mostrar a contagem entre parênteses
    await expect(page.locator("text=/\\(\\d+\\)/").first()).toBeVisible({ timeout: 5_000 });

    console.log("✓ Seção Trilhas visível com contagem");
  });

  test("exibe seção de Colunas padrão", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h2").filter({ hasText: /Colunas padrão/i })).toBeVisible({ timeout: 8_000 });

    console.log("✓ Seção Colunas padrão visível");
  });

  test("botão Gerenciar abre modal de trilhas", async ({ page }) => {
    await page.goto("/settings");

    // Primeiro botão Gerenciar (seção Trilhas)
    const gerenciarBtns = page.locator("button").filter({ hasText: /Gerenciar/i });
    await expect(gerenciarBtns.first()).toBeVisible({ timeout: 8_000 });
    await gerenciarBtns.first().click();

    // Modal de trilhas deve aparecer (título "TRILHAS" ou similar)
    await expect(
      page.locator("div[class*='fixed']").filter({ hasText: /Trilha/i }).first()
    ).toBeVisible({ timeout: 5_000 });

    // Fechar modal com Escape
    await page.keyboard.press("Escape");

    console.log("✓ Modal de trilhas abre via botão Gerenciar");
  });

  test("botão Gerenciar abre modal de colunas padrão", async ({ page }) => {
    await page.goto("/settings");

    // Segundo botão Gerenciar (seção Colunas)
    const gerenciarBtns = page.locator("button").filter({ hasText: /Gerenciar/i });
    await expect(gerenciarBtns.nth(1)).toBeVisible({ timeout: 8_000 });
    await gerenciarBtns.nth(1).click();

    // Modal de colunas deve aparecer
    await expect(
      page.locator("div[class*='fixed']").filter({ hasText: /Coluna/i }).first()
    ).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");

    console.log("✓ Modal de colunas abre via botão Gerenciar");
  });

  test("acessa /settings pelo menu do avatar", async ({ page }) => {
    await goToBoard(page);

    // Clica no avatar (botão com initials)
    const avatarBtn = page.locator("button.avatar-btn");
    await expect(avatarBtn).toBeVisible({ timeout: 8_000 });
    await avatarBtn.click();

    // Menu dropdown deve aparecer com link para /settings
    const settingsMenuItem = page.locator("a[href='/settings']").filter({ hasText: /Configurações/i });
    await expect(settingsMenuItem).toBeVisible({ timeout: 3_000 });
    await settingsMenuItem.click();

    await expect(page).toHaveURL(/\/settings/, { timeout: 5_000 });

    console.log("✓ /settings acessível pelo menu do avatar");
  });
});
