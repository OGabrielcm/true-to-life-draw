import { chromium } from "@playwright/test";

const BASE_URL = "http://localhost:5174";
const STATE_PATH = "tests/e2e/.auth-state.json";

async function globalSetup() {
  const email = process.env.TEST_EMAIL!;
  const password = process.env.TEST_PASSWORD!;

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
