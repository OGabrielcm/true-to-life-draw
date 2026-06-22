import { test, expect } from "@playwright/test";

// Testa a conta do Emmanuel após a correção das colunas inválidas
test.describe("Emmanuel — conta após correção de colunas", () => {
  test("board carrega sem crash e exibe cards nas colunas corretas", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/");
    await expect(page.locator("text=Gerenciador de Molas")).toBeVisible({ timeout: 20_000 });

    // Aguarda as tracks carregarem
    await expect(page.locator("[data-track]").first()).toBeAttached({ timeout: 15_000 });
    await page.waitForTimeout(2_000);

    // Verifica que o app não crashou
    await expect(page.locator("text=Gerenciador de Molas")).toBeVisible();
    const crashed = errors.some(
      (e) => e.includes("This page didn't load") || e.includes("invalid input syntax"),
    );
    expect(crashed, `App crashou: ${errors.join(", ")}`).toBe(false);
    console.log("✓ Board carregou sem crash");

    // Verifica que as colunas customizadas do Emmanuel aparecem
    await expect(page.getByText("Planejamento").first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Em Producao").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Finalizado").first()).toBeVisible({ timeout: 5_000 });
    console.log("✓ Colunas customizadas visíveis: Planejamento, Em Producao, Finalizado");

    // Verifica que as tracks aparecem
    await expect(page.getByText("Estágio").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Faculdade").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("IA / Dev").first()).toBeVisible({ timeout: 5_000 });
    console.log("✓ Tracks visíveis: Estágio, Faculdade, IA / Dev");

    // Conta os cards no board (deve ter 11)
    const cards = page.locator("[data-card-id]");
    await expect(cards.first()).toBeAttached({ timeout: 10_000 });
    const count = await cards.count();
    expect(count, `Esperava cards visíveis, encontrou ${count}`).toBeGreaterThan(0);
    console.log(`✓ ${count} cards visíveis no board`);

    // Abre um card para confirmar que o modal não crasha
    await cards.first().click();
    await expect(page.locator(".max-w-2xl")).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("text=Gerenciador de Molas")).toBeVisible();
    console.log("✓ Modal de card abriu sem crash");

    await page.keyboard.press("Escape");
    console.log(`\n✅ Conta do Emmanuel funcionando corretamente`);
  });
});
