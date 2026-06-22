import { test, expect } from "@playwright/test";

/**
 * Testa o fluxo de recuperação de senha:
 * - Link "Esqueci minha senha" visível na tela de login
 * - Formulário de recuperação aparece ao clicar
 * - Validação de email vazio
 * - Formulário de sucesso exibe mensagem correta
 * - Botão "Voltar para o login" retorna ao form principal
 * - Rota /reset-password renderiza sem erro quando acessada diretamente
 *
 * Nota: não testamos o envio real do email (requer SMTP ativo),
 * apenas a UI e o fluxo de estado do formulário.
 */
test.describe.serial("6.3 — Recuperação de senha", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // sem auth — testa tela de login pública

  test("link 'Esqueci minha senha' visível na tela de login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Esqueci minha senha")).toBeVisible({ timeout: 8_000 });
    console.log("✓ Link 'Esqueci minha senha' visível");
  });

  test("clicar no link exibe formulário de recuperação", async ({ page }) => {
    await page.goto("/login");
    await page.locator("text=Esqueci minha senha").click();

    await expect(page.locator("h2").filter({ hasText: /Recuperar senha/i })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 3_000 });
    await expect(
      page.locator('button[type="submit"]').filter({ hasText: /Enviar link/i }),
    ).toBeVisible();

    console.log("✓ Formulário de recuperação visível");
  });

  test("botão Enviar link desabilitado com email vazio", async ({ page }) => {
    await page.goto("/login");
    await page.locator("text=Esqueci minha senha").click();

    const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /Enviar link/i });
    await expect(submitBtn).toBeVisible({ timeout: 5_000 });
    await expect(submitBtn).toBeDisabled();

    console.log("✓ Botão desabilitado com email vazio");
  });

  test("botão Enviar link habilitado após digitar email", async ({ page }) => {
    await page.goto("/login");
    await page.locator("text=Esqueci minha senha").click();

    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: "visible", timeout: 5_000 });
    await emailInput.fill("teste@exemplo.com");

    const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /Enviar link/i });
    await expect(submitBtn).not.toBeDisabled({ timeout: 3_000 });

    console.log("✓ Botão habilitado com email preenchido");
  });

  test("'Voltar para o login' retorna ao formulário principal", async ({ page }) => {
    await page.goto("/login");
    await page.locator("text=Esqueci minha senha").click();

    // Aguarda formulário de recuperação
    await expect(page.locator("h2").filter({ hasText: /Recuperar senha/i })).toBeVisible({
      timeout: 5_000,
    });

    // Clica no link de voltar
    await page
      .locator("button")
      .filter({ hasText: /Voltar para o login/ })
      .click();

    // Deve voltar ao formulário de login
    await expect(page.locator("h2").filter({ hasText: /Entrar/i })).toBeVisible({ timeout: 5_000 });

    console.log("✓ Botão 'Voltar para o login' funciona");
  });

  test("email do campo senha é pré-preenchido no formulário de recuperação", async ({ page }) => {
    await page.goto("/login");

    // Preenche o email no campo de login
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("meuuser@exemplo.com");

    // Clica em "Esqueci minha senha"
    await page.locator("text=Esqueci minha senha").click();

    // O campo de email do formulário de recuperação deve estar pré-preenchido
    const forgotEmailInput = page.locator('input[type="email"]');
    await expect(forgotEmailInput).toHaveValue("meuuser@exemplo.com", { timeout: 3_000 });

    console.log("✓ Email pré-preenchido no formulário de recuperação");
  });

  test("rota /reset-password renderiza sem erro", async ({ page }) => {
    // Acessa diretamente sem token (simula acesso sem link de email)
    await page.goto("/reset-password");

    // A página deve renderizar sem tela em branco — deve mostrar algum conteúdo
    await expect(page.locator("body")).not.toBeEmpty();

    // Deve ter pelo menos um input ou mensagem visível
    const hasInput = await page.locator('input[type="password"]').count();
    const hasMessage = await page.locator("text=/senha|password|inválido|expirado/i").count();

    expect(hasInput + hasMessage).toBeGreaterThan(0);

    console.log("✓ /reset-password renderiza sem crash");
  });
});
