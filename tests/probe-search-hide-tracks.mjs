// Probe do 2.3-addendum: ao buscar, trilhas sem card correspondente são
// ocultadas. Lê o título de um card real, busca uma palavra dele e confirma que
// (a) ainda há ao menos 1 trilha visível e (b) toda trilha visível contém algum
// card (nenhuma trilha vazia sobra na busca).
//
// Uso: node tests/probe-search-hide-tracks.mjs   (dev server em :5174)

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
  await page.waitForSelector("[data-track]", { timeout: 20000 });

  const tracksBefore = await page.locator("[data-track]").count();
  ok(`board com ${tracksBefore} trilha(s) sem busca`);
  if (tracksBefore < 2) {
    // sem ao menos 2 trilhas o teste de "ocultar" não é significativo; ainda
    // validamos que a busca não some com tudo.
    console.log("      · (conta de teste tem <2 trilhas; valida só a não-regressão)");
  }

  // pega o título do primeiro card e extrai uma palavra distintiva (>3 letras)
  const cardTitle = await page.locator("[data-card-id]").first().innerText();
  const word = (cardTitle.match(/[A-Za-zÀ-ÿ]{4,}/) || ["card"])[0];

  const search = page.locator('input[placeholder*="Buscar"], input[placeholder*="Search"]');
  await search.first().click();
  await search.first().fill(word);
  await page.waitForTimeout(700);

  const tracksAfter = await page.locator("[data-track]").count();
  ok(`busca "${word}" → ${tracksAfter} trilha(s) visível(is)`);

  // (a) não some com tudo (a busca casa pelo menos o card de onde tiramos a palavra)
  if (tracksAfter >= 1) ok("ao menos 1 trilha permanece visível na busca");
  else bad("busca ocultou TODAS as trilhas (não deveria)");

  // (b) toda trilha visível tem ao menos 1 card visível (nenhuma trilha vazia)
  const emptyVisibleTracks = await page.evaluate(() => {
    let empty = 0;
    document.querySelectorAll("[data-track]").forEach((tr) => {
      if (tr.querySelectorAll("[data-card-id]").length === 0) empty++;
    });
    return empty;
  });
  if (emptyVisibleTracks === 0) ok("nenhuma trilha vazia visível durante a busca");
  else bad(`${emptyVisibleTracks} trilha(s) vazia(s) ainda visível(is) na busca (2.3 falhou)`);

  // (c) limpar a busca traz todas as trilhas de volta
  await search.first().fill("");
  await page.waitForTimeout(500);
  const tracksCleared = await page.locator("[data-track]").count();
  if (tracksCleared === tracksBefore) ok("limpar busca restaura todas as trilhas");
  else bad(`após limpar busca: ${tracksCleared} trilhas (esperado ${tracksBefore})`);

  await browser.close();
  console.log(`\n${fail === 0 ? "PROBE GREEN" : "PROBE RED"} (${fail} falhas)`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE CRASH:", e);
  process.exit(1);
});
