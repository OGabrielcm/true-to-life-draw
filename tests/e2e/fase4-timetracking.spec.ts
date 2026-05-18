import { test, expect } from "@playwright/test";
import { goToBoard, createCard, openCard, RUN_ID } from "./helpers";

const CARD_TITLE = `[E2E-TIME-${RUN_ID}] Teste de Time Tracking`;

test.describe.serial("4.7 — Time tracking", () => {
  test.beforeEach(async ({ page }) => {
    await goToBoard(page);
  });

  test("setup: cria card de teste", async ({ page }) => {
    await createCard(page, CARD_TITLE);
  });

  test("registra 1h 30m e exibe na lista", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page.locator(".max-w-2xl button").filter({ hasText: /TEMPO|Tempo/i }).first().click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/^Time tracking/)).toBeVisible({ timeout: 5_000 });
    await page.locator("text=Registrar tempo").click();

    // Aguarda o formulário de registro aparecer
    await expect(page.locator('input[placeholder="h"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('input[placeholder="h"]').fill("1");
    await page.locator('input[placeholder="m"]').fill("30");
    await page.locator('input[placeholder*="Nota"]').fill("Trabalho de teste E2E");
    // Salvar do time log — botão que fica ao lado de "Cancelar" no form de registro
    await page.locator("button:has-text('Cancelar')").locator("..").locator("button:has-text('Salvar')").click();

    await expect(page.locator("text=1h 30m").first()).toBeVisible({ timeout: 8_000 });
    console.log("✓ 1h 30m registrado");
  });

  test("total acumula com segundo registro (45m)", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page.locator(".max-w-2xl button").filter({ hasText: /TEMPO|Tempo/i }).first().click();
    await page.waitForTimeout(300);
    await page.locator("text=Registrar tempo").click();
    await expect(page.locator('input[placeholder="h"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('input[placeholder="h"]').fill("0");
    await page.locator('input[placeholder="m"]').fill("45");
    await page.locator("button:has-text('Cancelar')").locator("..").locator("button:has-text('Salvar')").click();

    await expect(page.locator("text=2h 15m").last()).toBeVisible({ timeout: 5_000 });
    console.log("✓ Total 2h 15m");
  });

  test("deleta 45m e total volta a 1h 30m", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page.locator(".max-w-2xl button").filter({ hasText: /TEMPO|Tempo/i }).first().click();
    await page.waitForTimeout(300);
    const logRow = page.locator(".group").filter({ hasText: "45m" }).first();
    await logRow.hover();
    await logRow.locator("button").last().click();
    await expect(page.locator("text=1h 30m").last()).toBeVisible({ timeout: 5_000 });
    console.log("✓ Total 1h 30m após deletar");
  });

  test("persiste após reload", async ({ page }) => {
    await page.reload();
    await expect(page.locator("[data-col]").first()).toBeVisible({ timeout: 10_000 });
    await openCard(page, CARD_TITLE);
    await page.locator(".max-w-2xl button").filter({ hasText: /TEMPO|Tempo/i }).first().click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=1h 30m").first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("text=Trabalho de teste E2E")).toBeVisible({ timeout: 5_000 });
    console.log("✓ Persiste após reload");
  });

  test("teardown: exclui card de teste", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page.locator('button:has-text("Excluir")').first().click();
    await page.locator("button.bg-red-600").click();
    await expect(page.locator(`text="${CARD_TITLE}"`)).not.toBeVisible({ timeout: 5_000 });
  });
});
