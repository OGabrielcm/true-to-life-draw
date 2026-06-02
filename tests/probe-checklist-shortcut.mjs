// Probe do bug: digitar "e" (ou d/1-5) no input do checklist disparava o atalho
// global de editar card. Abre um card, vai pra aba Checklist, foca o input de
// adicionar item, digita "teste" e confirma que (a) o texto entrou no input e
// (b) o modal NÃO entrou em modo de edição de título.
//
// RED antes do fix (modo edição dispara), GREEN depois.
//
// Uso: node tests/probe-checklist-shortcut.mjs   (dev server em :5174)

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

  // abre o primeiro card e espera o modal (título <h2>)
  await page.locator("[data-card-id]").first().click();
  await page.waitForSelector("h2.text-xl", { timeout: 10000 });
  await page.waitForTimeout(400);
  // vai para a aba Checklist pelo atalho "2" (foco no body, comportamento normal)
  await page.keyboard.press("2");
  await page.waitForTimeout(600);

  const addInput = page.locator(
    'input[placeholder*="Adicionar item"], input[placeholder*="Add item"]',
  );
  if ((await addInput.count()) === 0) {
    bad("input de adicionar item do checklist não encontrado");
    await browser.close();
    process.exit(1);
  }

  // foca e digita uma palavra que contém "e", "d" e dígitos.
  // Com o bug, o "e" dispara setEditing(true) → a aba (e este input) DESMONTA
  // no meio da digitação, então a leitura abaixo falha de forma limpa (bad),
  // não como crash.
  await addInput.first().click();
  await addInput.first().type("teste1d", { delay: 40 });
  await page.waitForTimeout(400);

  // (a) o texto entrou no input? (lê com timeout curto; se o input sumiu por
  // causa do bug, vira bad() em vez de exceção)
  let val = null;
  try {
    val = await addInput.first().inputValue({ timeout: 3000 });
  } catch {
    val = null; // input destacado → bug
  }
  if (val === "teste1d") ok(`texto digitado intacto no input ("${val}")`);
  else if (val === null)
    bad("input do checklist desmontou ao digitar (atalho disparou edição) — BUG");
  else bad(`texto corrompido pelo atalho: input contém "${val}" (esperado "teste1d")`);

  // (b) o modal NÃO deve ter entrado em modo de edição.
  // Sinal: em modo NÃO-edição o título é um <h2>; em modo edição vira <input autofocus>
  // e o <h2> some. Checamos a presença do <h2> do título.
  const titleH2 = await page.locator("h2.text-xl.font-semibold").count();
  if (titleH2 > 0) ok("modal NÃO entrou em modo de edição (título ainda é <h2>)");
  else bad("BUG: digitar no checklist disparou o modo de edição do card (título virou input)");

  await browser.close();
  console.log(`\n${fail === 0 ? "PROBE GREEN" : "PROBE RED"} (${fail} falhas)`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE CRASH:", e);
  process.exit(1);
});
