// Smoke PROFUNDO do kanban-store refatorado: login real + exercita as vias que
// o refactor tocou (load via repo, addCard/deleteCard, abertura de card) contra
// o Supabase real. Loga interativamente (a restauração via storageState tem bug
// pré-existente). Tudo prefixado [E2E- para limpeza segura.
//
// Uso: SMOKE_BASE=http://localhost:5177 node tests/smoke-deep.mjs
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const BASE = process.env.SMOKE_BASE || "http://localhost:5177";
const env = readFileSync(new URL("../.env.test", import.meta.url), "utf8");
const EMAIL = env.match(/TEST_EMAIL=(.*)/)[1].trim();
const PASSWORD = env.match(/TEST_PASSWORD=(.*)/)[1].trim();
const CARD = `[E2E-DEEP] ${Date.now()}`;

let fail = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  fail++;
};

async function launch() {
  for (const channel of ["chrome", "msedge", undefined]) {
    try {
      return await chromium.launch({ headless: true, channel });
    } catch {
      /* próximo */
    }
  }
  throw new Error("nenhum browser disponível");
}

const browser = await launch();
const page = await browser.newPage();
const jsErrors = [];
page.on("pageerror", (e) => jsErrors.push(e.message));

try {
  // ── Login + load do board (repo.loadAll, mappers, getColumnsForTrack) ──
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 30000 });
  ok("login → redirect /");

  await page.waitForSelector("[data-track]", { timeout: 30000 });
  const tracks = await page.locator("[data-track]").count();
  const cols = await page.locator("[data-col]").count();
  tracks > 0 ? ok(`board carregou: ${tracks} track(s)`) : bad("0 tracks");
  cols > 0 ? ok(`${cols} coluna(s) (getColumnsForTrack ok)`) : bad("0 colunas");

  // ── addCard (lê stateRef.cards p/ nextOrder, repo.tasks.insert) ──
  await page.locator('button:has-text("CRIAR")').first().click();
  await page.waitForSelector("input[required]", { state: "visible", timeout: 8000 });
  await page.locator("input[required]").first().fill(CARD);
  // Submit via type=submit p/ não colidir com o botão "CRIAR" (has-text é substring).
  await page.locator('button[type="submit"]').first().click();
  await page.waitForSelector("input[required]", { state: "hidden", timeout: 8000 });
  const card = page.locator("[data-card-id]").filter({ hasText: CARD }).first();
  await card.waitFor({ state: "visible", timeout: 10000 });
  ok("addCard: card aparece no board e persistiu");

  // ── abrir card (loadCardDetails) ──
  await card.click();
  await page.waitForSelector(".max-w-4xl", { timeout: 8000 });
  ok("card abre (loadCardDetails sem crash)");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // ── reload: confirma persistência real (não só estado local otimista) ──
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-track]", { timeout: 30000 });
  const afterReload = page.locator("[data-card-id]").filter({ hasText: CARD }).first();
  (await afterReload.count()) > 0
    ? ok("card sobreviveu ao reload (gravou no Supabase)")
    : bad("card sumiu no reload — não persistiu");

  // ── deleteCard (repo.tasks.remove) — também é teardown ──
  await afterReload.click();
  await page.waitForSelector(".max-w-4xl", { timeout: 8000 });
  await page.locator('button:has-text("Excluir")').first().click();
  const confirm = page.locator("button.bg-red-600").first();
  if (await confirm.count()) await confirm.click();
  await page.waitForTimeout(1200);
  const gone = (await page.locator("[data-card-id]").filter({ hasText: CARD }).count()) === 0;
  gone ? ok("deleteCard: card removido") : bad("card ainda presente após excluir");
} catch (e) {
  bad(`exceção: ${e.message}`);
}

if (jsErrors.length) {
  for (const m of jsErrors) bad(`pageerror: ${m}`);
} else {
  ok("nenhum pageerror durante o fluxo");
}

await browser.close();
console.log(`\n${fail === 0 ? "DEEP SMOKE GREEN" : "DEEP SMOKE RED"} (${fail} falhas)`);
process.exit(fail === 0 ? 0 : 1);
