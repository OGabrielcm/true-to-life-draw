// Probe do Bloco 5 — Responsividade mobile do dashboard.
//
// Mapeia QUEBRAS por RENDERIZAÇÃO (não por leitura de classes): renderiza o
// dashboard em 390px e 375px e mede overflow horizontal real + truncamento de
// texto nos grupos priorizados (KPIs, gráficos, tabela, filtros). Tira
// screenshots para inspeção visual.
//
// O breakpoint mobile do app é 768px (AppShell sidebar = md:) — guardrail, não
// se altera. Em 390/375 estamos bem abaixo dele.
//
// Uso: node tests/probe-dashboard-mobile.mjs   (dev server em :5174)

import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = "http://localhost:5174";
const env = readFileSync(new URL("../.env.test", import.meta.url), "utf8");
const EMAIL = env.match(/TEST_EMAIL=(.*)/)[1].trim();
const PASSWORD = env.match(/TEST_PASSWORD=(.*)/)[1].trim();
const OUT = new URL("../tmp-shots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

let fail = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  fail++;
};
const info = (m) => console.log(`      · ${m}`);

async function checkViewport(page, width) {
  await page.setViewportSize({ width, height: 780 });
  await page.goto(`${BASE}/dashboards`, { waitUntil: "domcontentloaded" });
  // espera os KPIs renderizarem
  await page.waitForSelector("table", { timeout: 20000 });
  await page.waitForTimeout(400);

  console.log(`\n── viewport ${width}px ──`);

  // 1) Overflow horizontal da PÁGINA (o conteúdo principal não pode estourar a tela).
  // A tabela tem scroll próprio (overflow-x-auto) — então medimos o overflow
  // EXCLUINDO containers com overflow-x auto/scroll.
  const pageOverflow = await page.evaluate((vw) => {
    const docW = document.documentElement.scrollWidth;
    const offenders = [];
    document.querySelectorAll("main *, [class*='mx-auto'] *").forEach((el) => {
      const style = getComputedStyle(el);
      if (style.overflowX === "auto" || style.overflowX === "scroll") return;
      if (el.scrollWidth > vw + 1 && el.getBoundingClientRect().width > vw + 1) {
        // ignora os que estão DENTRO de um scroller
        let p = el.parentElement,
          inScroller = false;
        while (p) {
          const ps = getComputedStyle(p);
          if (ps.overflowX === "auto" || ps.overflowX === "scroll") {
            inScroller = true;
            break;
          }
          p = p.parentElement;
        }
        if (!inScroller) {
          offenders.push(
            `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ").slice(0, 2).join(".")} w=${Math.round(el.getBoundingClientRect().width)}`,
          );
        }
      }
    });
    return { docW, offenders: offenders.slice(0, 8) };
  }, width);

  if (pageOverflow.docW <= width + 1)
    ok(`sem overflow horizontal da página (scrollWidth=${pageOverflow.docW})`);
  else {
    bad(`página estoura ${width}px (scrollWidth=${pageOverflow.docW})`);
    pageOverflow.offenders.forEach((o) => info(`overflow: ${o}`));
  }

  // 2) Tabela tem scroller horizontal (affordance de scroll exigida pelo prompt).
  const tableScroll = await page.evaluate(() => {
    const t = document.querySelector("table");
    const scroller = t?.parentElement;
    if (!scroller) return null;
    return {
      scrollable: scroller.scrollWidth > scroller.clientWidth,
      hasOverflowAuto:
        getComputedStyle(scroller).overflowX === "auto" ||
        getComputedStyle(scroller).overflowX === "scroll",
    };
  });
  if (tableScroll?.hasOverflowAuto && tableScroll?.scrollable)
    ok("tabela rola horizontalmente (conteúdo > largura)");
  else if (tableScroll?.hasOverflowAuto)
    info("tabela tem overflow-x auto mas coube sem rolar nesta largura");
  else bad("tabela sem container de scroll horizontal");

  // 3) Texto truncado SEM affordance: procura elementos com text-overflow ellipsis
  //    (truncate/text-ellipsis) cujo conteúdo está cortado e sem title/tooltip.
  const truncated = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("main *").forEach((el) => {
      const s = getComputedStyle(el);
      const clipped = s.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1;
      if (clipped && !el.title && el.children.length === 0) {
        out.push((el.textContent || "").trim().slice(0, 30));
      }
    });
    return out.slice(0, 8);
  });
  if (truncated.length === 0) ok("nenhum texto truncado sem indicação (title/tooltip)");
  else {
    bad(`${truncated.length} texto(s) truncado(s) sem affordance`);
    truncated.forEach((tx) => info(`"${tx}…"`));
  }

  await page.screenshot({ path: `${OUT}dashboard-${width}.png`, fullPage: true });
  info(`screenshot: tmp-shots/dashboard-${width}.png`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (e) => bad(`pageerror: ${e.message}`));

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 20000 });
  ok("login ok");

  await checkViewport(page, 390);
  await checkViewport(page, 375);

  await browser.close();
  console.log(`\n${fail === 0 ? "PROBE GREEN" : "PROBE RED"} (${fail} falhas)`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE CRASH:", e);
  process.exit(1);
});
