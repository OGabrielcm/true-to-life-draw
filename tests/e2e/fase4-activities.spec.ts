import { test, expect } from "@playwright/test";
import { goToBoard, createCard, openCard } from "./helpers";

const CARD_TITLE = "[E2E-ACT] Teste de Atividades";

test.describe.serial("4.5 — Histórico de atividades", () => {
  test.beforeEach(async ({ page }) => {
    await goToBoard(page);
  });

  test("setup: cria card de teste", async ({ page }) => {
    await createCard(page, CARD_TITLE);
    // Aguarda logActivity completar o insert assíncrono
    await page.waitForTimeout(3_000);
  });

  test("registra atividade 'criado' ao abrir card", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    // Clica na tab "Atividade" (tab 4 no novo modal)
    await page.locator(".max-w-2xl button").filter({ hasText: /ATIVIDADE|Atividade/i }).first().click();
    await page.waitForTimeout(1_000);
    await expect(page.getByText(/Atividades \(\d+\)/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Card criado/i)).toBeVisible({ timeout: 8_000 });
    console.log("✓ Atividade 'criado' registrada");
  });

  test("registra atividade ao mover card de coluna", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    // Mover está na aba Detalhes (default)
    const moveBtn = page.locator("text=Mover para coluna").locator("..").locator("button").first();
    const colName = (await moveBtn.textContent())?.trim();
    await moveBtn.click();
    await page.waitForTimeout(500);
    await goToBoard(page);
    await openCard(page, CARD_TITLE);
    // Verifica na aba Atividade
    await page.locator(".max-w-2xl button").filter({ hasText: /ATIVIDADE|Atividade/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=/Movido:/i")).toBeVisible({ timeout: 8_000 });
    console.log(`✓ Movido → ${colName}`);
  });

  test("registra atividade ao favoritar card", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page.locator('button[aria-label="Favoritar"]').click();
    await page.waitForTimeout(600);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    await openCard(page, CARD_TITLE);
    // Verifica na aba Atividade
    await page.locator(".max-w-2xl button").filter({ hasText: /ATIVIDADE|Atividade/i }).first().click();
    await page.waitForTimeout(500);
    await expect(
      page.locator("text=/Marcado como favorito|Removido dos favoritos/i"),
    ).toBeVisible({ timeout: 8_000 });
    console.log("✓ Atividade de favoritar registrada");
  });

  test("teardown: exclui card de teste", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page.locator('button:has-text("Excluir")').first().click();
    await page.locator("button.bg-red-600").click();
    await expect(page.locator(`text="${CARD_TITLE}"`)).not.toBeVisible({ timeout: 5_000 });
  });
});
