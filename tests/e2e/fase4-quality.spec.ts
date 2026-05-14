import { test, expect } from "@playwright/test";
import { goToBoard, createCard, openCard } from "./helpers";

const CARD_TITLE = "[E2E-QOL] Teste Quality of Life";

test.describe.serial("4.1–4.4 — Quality of Life", () => {
  test.beforeEach(async ({ page }) => {
    await goToBoard(page);
  });

  test("setup: cria card de teste", async ({ page }) => {
    await createCard(page, CARD_TITLE);
  });

  // ── 4.1 Markdown na descrição ──────────────────────────────────────────────
  test("4.1 — markdown renderiza negrito na descrição", async ({ page }) => {
    await openCard(page, CARD_TITLE);

    // Ativa modo de edição com a tecla 'e'
    await page.keyboard.press("e");
    const descArea = page.locator('textarea[placeholder*="Descrição"]');
    await descArea.waitFor({ state: "visible", timeout: 5_000 });
    await descArea.fill("**negrito** e _itálico_");

    await page.locator(".max-w-lg button:has-text('Salvar')").first().click();
    await page.waitForTimeout(500);

    // Reabre o card para ver o markdown renderizado
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await openCard(page, CARD_TITLE);

    // Verifica que <strong> foi renderizado
    await expect(page.locator(".max-w-lg .prose strong").first()).toBeVisible({ timeout: 5_000 });
    console.log("✓ 4.1 Markdown renderiza negrito na descrição");
  });

  // ── 4.2 Atalhos de teclado ────────────────────────────────────────────────
  test("4.2 — atalho 'n' abre modal de criar card", async ({ page }) => {
    // Fecha qualquer modal aberto
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await page.keyboard.press("n");
    await expect(page.locator("text=Adicionar card")).toBeVisible({ timeout: 5_000 });
    console.log("✓ 4.2 Atalho 'n' abre criar card");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("4.2 — atalho 'e' ativa edição dentro do modal do card", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page.keyboard.press("e");

    // Em modo editing, o título vira um <input>
    const titleInput = page.locator(".max-w-lg input[type='text'], .max-w-lg input:not([type])").first();
    await expect(titleInput).toBeVisible({ timeout: 5_000 });
    console.log("✓ 4.2 Atalho 'e' ativa edição");

    await page.keyboard.press("Escape");
  });

  // ── 4.3 Card aging ────────────────────────────────────────────────────────
  test("4.3 — cards recém-criados têm opacity 1 (sem aging)", async ({ page }) => {
    // Card criado < 7 dias → getCardAging retorna 1 → opacity = 1
    const cardBtn = page.locator("[data-col] button").filter({ hasText: CARD_TITLE }).first();
    const opacity = await cardBtn.evaluate((el) => parseFloat(window.getComputedStyle(el).opacity));
    expect(opacity).toBeGreaterThanOrEqual(0.95);
    console.log(`✓ 4.3 Card aging: opacity=${opacity} (card novo, sem envelhecimento)`);
  });

  // ── 4.4 Cor de destaque / cover ───────────────────────────────────────────
  test("4.4 — aplica cor de destaque no card", async ({ page }) => {
    await openCard(page, CARD_TITLE);

    // Abre o color picker (botão com title="Cor de destaque")
    await page.locator('button[title="Cor de destaque"]').click();
    await page.waitForTimeout(300);

    // Seleciona o primeiro preset de cor (não o transparente)
    const colorBtns = page.locator(".absolute.right-0.top-8 button");
    await colorBtns.first().waitFor({ state: "visible", timeout: 5_000 });
    await colorBtns.nth(1).click(); // nth(0) é "nenhuma cor", nth(1) é a primeira cor real
    await page.waitForTimeout(500);

    // Fecha o modal e verifica barra colorida no card
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    const colorBar = page.locator("[data-card-id] div.h-1").first();
    await expect(colorBar).toBeVisible({ timeout: 5_000 });
    console.log("✓ 4.4 Cor de destaque aplicada no card");
  });

  test("teardown: exclui card de teste", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page.locator('button:has-text("Excluir")').first().click();
    await page.locator("button.bg-red-600").click();
    await expect(page.locator(`text="${CARD_TITLE}"`)).not.toBeVisible({ timeout: 5_000 });
  });
});
