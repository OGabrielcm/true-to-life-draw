// Probe do bug: digitar "n" na busca do board disparava o atalho global de
// "novo card". Foca a busca, digita "negocio" e confirma que (a) o texto entrou
// intacto e (b) NÃO abriu o modal/form de adicionar card.
//
// RED antes do fix, GREEN depois.
//
// Uso: node tests/probe-board-shortcut.mjs   (dev server em :5174)

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
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (e) => bad(`pageerror: ${e.message}`));

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 20000 });
  await page.waitForSelector("[data-card-id]", { timeout: 20000 });
  ok("login + board");

  // input de busca (AppShell) — placeholder "Buscar tarefas…"
  const search = page.locator('input[placeholder*="Buscar"], input[placeholder*="Search"]');
  if ((await search.count()) === 0) {
    bad("input de busca não encontrado");
    await browser.close();
    process.exit(1);
  }

  await search.first().click();
  await search.first().type("negocio", { delay: 40 }); // contém "n"
  await page.waitForTimeout(400);

  // (a) texto intacto?
  let val = null;
  try {
    val = await search.first().inputValue({ timeout: 3000 });
  } catch {
    val = null;
  }
  if (val === "negocio") ok(`texto da busca intacto ("${val}")`);
  else bad(`busca corrompida pelo atalho: "${val}" (esperado "negocio")`);

  // (b) NÃO deve ter aberto o form de adicionar card. O AddCardModal tem
  // placeholder de título; checamos que nenhum modal de criar card apareceu.
  const addModalOpen = await page.evaluate(() => {
    // heurística: o form de novo card mostra um input de título com autofocus
    // dentro de um overlay. Procuramos textos típicos do AddCardModal.
    const txt = document.body.innerText;
    return /Adicionar card|Add card|Usar template|Use template/.test(txt);
  });
  if (!addModalOpen) ok("nenhum form de novo card foi aberto");
  else bad("BUG: digitar 'n' na busca abriu o form de novo card");

  await browser.close();
  console.log(`\n${fail === 0 ? "PROBE GREEN" : "PROBE RED"} (${fail} falhas)`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE CRASH:", e);
  process.exit(1);
});
