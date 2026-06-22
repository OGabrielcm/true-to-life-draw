import { test, expect } from "@playwright/test";
import { goToBoard, createCard, openCard, RUN_ID } from "./helpers";

const CARD_TITLE = `[E2E-CMT-${RUN_ID}] Teste de Comentários`;

test.describe.serial("4.6 — Comentários no card", () => {
  test.beforeEach(async ({ page }) => {
    await goToBoard(page);
  });

  test("setup: cria card de teste", async ({ page }) => {
    await createCard(page, CARD_TITLE);
  });

  test("adiciona comentário (Ctrl+Enter)", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page
      .locator(".max-w-2xl button")
      .filter({ hasText: /COMENTÁRIOS|Comentários/i })
      .first()
      .click();
    await page.waitForTimeout(300);

    const textarea = page.locator('textarea[placeholder*="Adicionar comentário"]');
    await textarea.fill("Comentário de teste E2E");
    await textarea.press("Control+Enter");

    await expect(page.locator("text=Comentário de teste E2E")).toBeVisible({ timeout: 5_000 });
    console.log("✓ Comentário adicionado");
  });

  test("persiste após reabrir modal", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page
      .locator(".max-w-2xl button")
      .filter({ hasText: /COMENTÁRIOS|Comentários/i })
      .first()
      .click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=Comentário de teste E2E")).toBeVisible({ timeout: 8_000 });
    console.log("✓ Comentário persiste");
  });

  test("edita comentário existente", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page
      .locator(".max-w-2xl button")
      .filter({ hasText: /COMENTÁRIOS|Comentários/i })
      .first()
      .click();
    await page.waitForTimeout(300);
    const group = page.locator(".group").filter({ hasText: "Comentário de teste E2E" }).first();
    // Força hover via JS para revelar botões com opacity-0
    await group.hover({ force: true });
    await page.waitForTimeout(300);
    // Botão lápis (Pencil) é o primeiro botão dentro do grupo de ações
    const editBtn = group
      .locator("button")
      .filter({ has: page.locator("svg") })
      .first();
    await editBtn.click({ force: true });

    // Aguarda o textarea de edição aparecer (tem autoFocus)
    const editTextarea = page.locator("textarea").last();
    await editTextarea.waitFor({ state: "visible", timeout: 5_000 });
    await editTextarea.fill("Comentário editado E2E");
    // Clica no botão de confirmar (ícone Check — verde)
    await page.locator("button.text-green-600").click();

    await expect(page.locator("text=Comentário editado E2E")).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("text=(editado)")).toBeVisible({ timeout: 5_000 });
    console.log("✓ Comentário editado");
  });

  test("deleta comentário", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page
      .locator(".max-w-2xl button")
      .filter({ hasText: /COMENTÁRIOS|Comentários/i })
      .first()
      .click();
    await page.waitForTimeout(300);
    // Hover forçado para revelar botões com opacity-0
    const group = page
      .locator(".group")
      .filter({ hasText: /Comentário/ })
      .first();
    await group.hover({ force: true });
    await page.waitForTimeout(300);
    // Botão de deletar é o segundo (Trash2) dentro do grupo de ações
    await group.locator("button.text-red-600").click({ force: true });
    await expect(page.locator("text=Comentário de teste E2E")).not.toBeVisible({ timeout: 5_000 });
    console.log("✓ Comentário deletado");
  });

  test("teardown: exclui card de teste", async ({ page }) => {
    await openCard(page, CARD_TITLE);
    await page.locator('button:has-text("Excluir")').first().click();
    await page.locator("button.bg-red-600").click();
    await expect(page.locator(`text="${CARD_TITLE}"`)).not.toBeVisible({ timeout: 5_000 });
  });
});
