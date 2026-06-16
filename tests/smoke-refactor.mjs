// Smoke do refactor do kanban-store SEM login: como KanbanProvider envolve o
// app inteiro (__root.tsx), carregar /login já monta o provider e exercita a
// criação do memo de ações, os refs (stateRef/slicesRef) e o efeito de load
// (early-return sem user). Qualquer import quebrado, dep circular ou erro na
// fase de render do provider derruba a página → este smoke pega.
import { chromium } from "@playwright/test";

const BASE = process.env.SMOKE_BASE || "http://localhost:5175";
const errors = [];

async function launch() {
  for (const channel of ["chrome", "msedge", undefined]) {
    try {
      return await chromium.launch({ headless: true, channel });
    } catch {
      /* tenta o próximo */
    }
  }
  throw new Error("nenhum browser disponível (chrome/msedge/chromium)");
}
const browser = await launch();
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
});
page.on("response", (r) => {
  if (r.status() === 404) console.log(`  404 -> ${r.url()}`);
});

// Só erros de JS reprovam o smoke; 404 de recurso (favicon/asset) é ruído.
const jsErrors = () => errors.filter((e) => e.startsWith("pageerror:"));

await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });

// Provider montou e a árvore renderizou se o form de login existe.
const emailVisible = await page
  .locator('input[type="email"]')
  .isVisible()
  .catch(() => false);
const pwVisible = await page
  .locator('input[type="password"]')
  .isVisible()
  .catch(() => false);

console.log(`login email input visível: ${emailVisible}`);
console.log(`login password input visível: ${pwVisible}`);
console.log(`erros capturados: ${errors.length}`);
for (const e of errors) console.log("  " + e);

await browser.close();

const green = emailVisible && pwVisible && jsErrors().length === 0;
console.log(green ? "\nSMOKE GREEN" : "\nSMOKE RED");
process.exit(green ? 0 : 1);
