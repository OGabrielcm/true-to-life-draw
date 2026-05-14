import { test, expect } from "@playwright/test";
import { goToBoard } from "./helpers";

const TRILHA_NAME = `[E2E-TRL] ${Date.now()}`;
const TRACK_NAME = `[E2E-TRK] ${Date.now()}`;
const CARD_TITLE = "[E2E-CRASH] Card trilha+track";

test.describe.serial("crash: criar track + trilha nova e associar a card", () => {
  test.beforeEach(async ({ page }) => {
    await goToBoard(page);
  });

  test("1 — cria trilha nova sem crash", async ({ page }) => {
    await page.locator("button").filter({ hasText: "Trilhas" }).click();
    await expect(page.locator("text=Gerenciar trilhas")).toBeVisible({ timeout: 8_000 });

    // O form de nova trilha já está visível no modal
    const nameInput = page.locator('input[placeholder="Nome da trilha"]');
    await nameInput.waitFor({ state: "visible", timeout: 5_000 });
    await nameInput.fill(TRILHA_NAME);

    await page.locator("button:has-text('Criar')").last().click();
    await page.waitForTimeout(500);

    // Trilha aparece na lista
    await expect(page.locator(".max-w-lg, [role='dialog']").getByText(TRILHA_NAME)).toBeVisible({ timeout: 8_000 });
    console.log(`✓ Trilha "${TRILHA_NAME}" criada`);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // App não crashou — board ainda visível
    await expect(page.locator("text=Gerenciador de Molas")).toBeVisible({ timeout: 5_000 });
    console.log("✓ App não crashou após criar trilha");
  });

  test("2 — cria track nova sem crash", async ({ page }) => {
    await page.locator("button").filter({ hasText: "Tracks" }).last().click();
    await expect(page.locator("text=Gerenciar tracks")).toBeVisible({ timeout: 8_000 });

    const nameInput = page.locator('input[placeholder="Nome da track"]');
    await nameInput.waitFor({ state: "visible", timeout: 5_000 });
    await nameInput.fill(TRACK_NAME);

    await page.locator("button:has-text('Criar')").last().click();
    await page.waitForTimeout(500);

    await expect(page.locator(".max-w-lg, [role='dialog']").getByText(TRACK_NAME)).toBeVisible({ timeout: 8_000 });
    console.log(`✓ Track "${TRACK_NAME}" criada`);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await expect(page.locator("text=Gerenciador de Molas")).toBeVisible({ timeout: 5_000 });
    console.log("✓ App não crashou após criar track");
  });

  test("3 — cria card na nova track com a nova trilha — não crasha", async ({ page }) => {
    await page.locator('button:has-text("Create")').click();
    await expect(page.locator("text=Adicionar card")).toBeVisible({ timeout: 8_000 });

    // Preenche título
    await page.locator("input[required]").first().fill(CARD_TITLE);

    // O modal já seleciona a track automaticamente via dropdown
    // Seleciona a trilha dentro do modal (seção "Trilhas / tags")
    const modal = page.locator(".fixed.inset-0.z-50");
    const trilhaBtn = modal.locator("button").filter({ hasText: TRILHA_NAME }).first();
    if (await trilhaBtn.count() > 0) {
      await trilhaBtn.click();
    }

    await page.locator('button:has-text("Criar")').click();
    await expect(page.locator("text=Adicionar card")).not.toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(1_000);

    // App não crashou
    await expect(page.locator("text=Gerenciador de Molas")).toBeVisible({ timeout: 5_000 });
    console.log("✓ Card criado sem crash");
  });

  test("4 — abre card — modal não crasha", async ({ page }) => {
    const card = page.locator("[data-card-id]").filter({ hasText: CARD_TITLE }).first();
    await card.waitFor({ state: "visible", timeout: 10_000 });
    await card.click();

    await expect(page.locator(".max-w-lg")).toBeVisible({ timeout: 8_000 });
    // App ainda no ar
    await expect(page.locator("text=Gerenciador de Molas")).toBeVisible({ timeout: 5_000 });
    console.log("✓ Modal abriu sem crash");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("5 — teardown", async ({ page }) => {
    // Exclui card
    const card = page.locator("[data-card-id]").filter({ hasText: CARD_TITLE }).first();
    if (await card.count() > 0) {
      await card.click();
      await page.locator('button:has-text("Excluir")').first().click();
      await page.locator("button.bg-red-600").click();
      await page.waitForTimeout(500);
    }

    // Exclui track
    await page.locator("button").filter({ hasText: "Tracks" }).last().click();
    await page.waitForTimeout(400);
    const trackRow = page.locator("li, .group").filter({ hasText: TRACK_NAME }).first();
    if (await trackRow.count() > 0) {
      await trackRow.hover({ force: true });
      await trackRow.locator("button.text-red-600").first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Exclui trilha
    await page.locator("button").filter({ hasText: "Trilhas" }).click();
    await page.waitForTimeout(400);
    const trilhaRow = page.locator("li, .group").filter({ hasText: TRILHA_NAME }).first();
    if (await trilhaRow.count() > 0) {
      await trilhaRow.locator("button").last().click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.keyboard.press("Escape");

    console.log("✓ Teardown completo");
  });
});
