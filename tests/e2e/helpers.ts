import { type Page, expect } from "@playwright/test";

export async function goToBoard(page: Page) {
  await page.goto("/");
  await expect(page.locator("text=Gerenciador de Molas")).toBeVisible({ timeout: 15_000 });

  // Aguarda as tracks carregarem do Supabase (pelo menos 1 [data-track] no DOM)
  await expect(page.locator("[data-track]").first()).toBeAttached({ timeout: 15_000 });

  // Expande todas as tracks colapsadas (chevron com rotate(-90deg) = colapsada)
  // Repete até não restar nenhuma colapsada
  for (let attempt = 0; attempt < 5; attempt++) {
    const collapsed = page.locator("[data-track] button svg[style*='rotate(-90deg)']");
    const count = await collapsed.count();
    if (count === 0) break;
    for (let i = 0; i < count; i++) {
      await collapsed.nth(i).locator("..").locator("..").click().catch(() => {});
      await page.waitForTimeout(200);
    }
  }

  // [data-col] só existe quando a track está expandida — aguarda ao menos 1
  await expect(page.locator("[data-col]").first()).toBeAttached({ timeout: 10_000 });
}

export async function createCard(page: Page, title: string) {
  // Garante que tracks estão carregadas no store
  await expect(page.locator("[data-track]").first()).toBeAttached({ timeout: 10_000 });

  await page.locator('button:has-text("Create")').click();
  await expect(page.locator("text=Adicionar card")).toBeVisible({ timeout: 8_000 });

  // Input de título: único input[required] no modal
  const titleInput = page.locator("input[required]").first();
  await titleInput.waitFor({ state: "visible", timeout: 5_000 });
  await titleInput.click();
  await titleInput.fill(title);
  await expect(titleInput).toHaveValue(title);

  await page.locator('button:has-text("Criar")').click();

  // Aguarda modal fechar e card aparecer no board (sem reload — update otimista)
  await expect(page.locator("text=Adicionar card")).not.toBeVisible({ timeout: 5_000 });
  await expect(page.locator(`text="${title}"`)).toBeVisible({ timeout: 15_000 });
}

export async function openCard(page: Page, title: string) {
  await page.locator(`text="${title}"`).first().click();
  await expect(page.locator(".max-w-2xl")).toBeVisible({ timeout: 8_000 });
  await page.waitForTimeout(1_500);
}
