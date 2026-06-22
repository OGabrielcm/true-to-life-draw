// Probe de fumaça do kanban-store via LOGIN INTERATIVO.
//
// Por que existe: a suíte E2E não restaura sessão via storageState (bug
// pré-existente, provável Bloco 2.1 — ver memory project_session_restore).
// Este probe loga interativamente (que comprovadamente carrega o board) e
// confirma que o board renderiza com dados reais — exercitando o efeito de
// load, getUser, os 4 mappers, a população de estado, o mount do provider e
// o consumo via useKanban.
//
// A verificação das vias ACOPLADAS do store (deleteTrack/deleteTrilha) é feita
// por REVISÃO DE DIFF (movimento verbatim do kernel preserva o acoplamento por
// construção), não por dirigir a UI — os seletores das specs estão defasados.
//
// Uso: node tests/probe-store-couplings.mjs   (dev server em :5174)

import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:5174";
const env = readFileSync(new URL("../.env.test", import.meta.url), "utf8");
const EMAIL = env.match(/TEST_EMAIL=(.*)/)[1].trim();
const PASSWORD = env.match(/TEST_PASSWORD=(.*)/)[1].trim();

let fail = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  fail++;
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (e) => bad(`pageerror: ${e.message}`));

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(`${BASE}/`, { timeout: 20000 });
  ok("login → redirect para /");

  await page.waitForSelector("[data-track]", { timeout: 20000 });
  const trackCount = await page.locator("[data-track]").count();
  if (trackCount > 0) ok(`board renderizou com ${trackCount} track(s) reais`);
  else bad("nenhum [data-track] no board");

  // colunas presentes (getColumnsForTrack funcionando)
  const colCount = await page.locator("[data-col]").count();
  if (colCount > 0) ok(`${colCount} coluna(s) renderizadas`);
  else bad("nenhuma [data-col]");

  // ── Regressão Bloco 2.1: RESTAURAÇÃO de sessão (reload da mesma aba) ──
  // Antes do fix, o kanban-store trava no skeleton no reload (getUser() corre
  // contra a hidratação da sessão e não há SIGNED_IN para re-disparar o load).
  await page.reload({ waitUntil: "domcontentloaded" });
  let restored = false;
  for (let i = 0; i < 24; i++) {
    if ((await page.locator("[data-track]").count()) > 0) {
      restored = true;
      break;
    }
    await page.waitForTimeout(500);
  }
  if (restored)
    ok(`board sobreviveu ao reload (${await page.locator("[data-track]").count()} tracks)`);
  else bad("board travou no reload — sessão restaurada não carregou (2.1)");

  // Segundo reload: confirma que kanban-store E user-profile-store sobrevivem a
  // restaurações repetidas (ambos compartilhavam a mesma classe de race).
  await page.reload({ waitUntil: "domcontentloaded" });
  let restored2 = false;
  for (let i = 0; i < 24; i++) {
    if ((await page.locator("[data-track]").count()) > 0) {
      restored2 = true;
      break;
    }
    await page.waitForTimeout(500);
  }
  if (restored2) ok("board sobreviveu ao 2º reload (user-profile-store ok)");
  else bad("board travou no 2º reload");

  await browser.close();
  console.log(`\n${fail === 0 ? "PROBE GREEN" : "PROBE RED"} (${fail} falhas)`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE CRASH:", e);
  process.exit(1);
});
