import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "http://localhost:5174";
const STATE_PATH = "tests/e2e/.auth-state.json";

async function globalSetup() {
  const email = process.env.TEST_EMAIL!;
  const password = process.env.TEST_PASSWORD!;

  // Limpa cards E2E residuais de runs anteriores
  const sb = createClient(
    "https://smdelyasoqtgcjdbldpf.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZGVseWFzb3F0Z2NqZGJsZHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTM5MDQsImV4cCI6MjA5NDAyOTkwNH0.5W6GuTh8CdKE-J_6GLFqwDDVXYdRZxUSCztTbU1s6ZI",
  );
  await sb.auth.signInWithPassword({ email, password });
  await sb.from("tasks").delete().like("title", "[E2E-%");
  console.log("✓ Banco limpo de resíduos E2E");

  // Salva estado de autenticação para os testes
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForSelector('text=Gerenciador de Molas', { timeout: 30_000 });
  await page.context().storageState({ path: STATE_PATH });

  await browser.close();
  console.log(`✓ Auth state saved to ${STATE_PATH}`);
}

export default globalSetup;
