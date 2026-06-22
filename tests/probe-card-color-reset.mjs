// Probe do 2.4: definir uma cor de destaque num card e depois resetar para
// "Nenhuma" deve REMOVER a cor. Reproduz o bug relatado ("cor trava na anterior").
//
// Como a cor é localStorage, o probe dirige a UI real: abre card → menu de cor →
// escolhe uma cor → confirma top bar → reabre menu → "Nenhuma" → top bar some.
//
// Uso: node tests/probe-card-color-reset.mjs   (dev server em :5174)

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

  const firstCard = page.locator("[data-card-id]").first();
  await firstCard.click();
  await page.waitForSelector("h2.text-xl", { timeout: 10000 });
  await page.waitForTimeout(400);

  // abre o menu de cor (botão com title = highlight_color)
  const colorBtn = page.locator('button[title*="destaque"], button[title*="ighlight"]');
  if ((await colorBtn.count()) === 0) {
    bad("botão de cor de destaque não encontrado");
    await browser.close();
    process.exit(1);
  }
  await colorBtn.first().click();
  await page.waitForTimeout(300);

  // escolhe a 2ª cor (a 1ª é "Nenhuma"); o grid de presets tem 8 botões
  const presetBtns = page.locator(".grid.grid-cols-4 button");
  const n = await presetBtns.count();
  if (n < 2) {
    bad(`grid de cores não renderizou (${n} botões)`);
    await browser.close();
    process.exit(1);
  }
  await presetBtns.nth(1).click(); // uma cor real
  await page.waitForTimeout(500);

  // fecha o modal e confirma a top bar de cor no card
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  // top bar = div h-[3px] dentro do card
  const barAfterSet = await firstCard.locator("div.h-\\[3px\\]").count();
  if (barAfterSet > 0) ok("cor aplicada: top bar aparece no card");
  else bad("cor não aplicou (sem top bar) — não dá pra testar o reset");

  // reabre o card e reseta para "Nenhuma"
  await firstCard.click();
  await page.waitForSelector("h2.text-xl", { timeout: 10000 });
  await page.waitForTimeout(300);
  await colorBtn.first().click();
  await page.waitForTimeout(300);
  await presetBtns.first().click(); // "Nenhuma"
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  // a top bar deve ter sumido
  const barAfterReset = await firstCard.locator("div.h-\\[3px\\]").count();
  if (barAfterReset === 0) ok("reset 'Nenhuma' removeu a cor (top bar sumiu)");
  else bad("BUG 2.4: cor NÃO resetou — top bar continua após escolher 'Nenhuma'");

  await browser.close();
  console.log(`\n${fail === 0 ? "PROBE GREEN" : "PROBE RED"} (${fail} falhas)`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE CRASH:", e);
  process.exit(1);
});
