// Probe do Bloco 2.3: busca casa título, descrição E nome de etiqueta.
// Login interativo (a suíte não restaura sessão — ver Bloco 2.1). Limpa antes
// e depois com prefixo [E2E-PROBE.
//
// Uso: node tests/probe-search-tags.mjs   (dev server em :5174)

import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:5174";
const SB_URL = "https://smdelyasoqtgcjdbldpf.supabase.co";
const SB_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZGVseWFzb3F0Z2NqZGJsZHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTM5MDQsImV4cCI6MjA5NDAyOTkwNH0.5W6GuTh8CdKE-J_6GLFqwDDVXYdRZxUSCztTbU1s6ZI";

const env = readFileSync(new URL("../.env.test", import.meta.url), "utf8");
const EMAIL = env.match(/TEST_EMAIL=(.*)/)[1].trim();
const PASSWORD = env.match(/TEST_PASSWORD=(.*)/)[1].trim();

const sb = createClient(SB_URL, SB_ANON);
let fail = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  fail++;
};

async function cleanup() {
  await sb.from("tasks").delete().like("title", "[E2E-PROBE%");
  await sb.from("trilhas").delete().like("name", "[E2E-PROBE%");
  await sb.from("tracks").delete().like("name", "[E2E-PROBE%");
}

async function main() {
  await sb.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  const uid = (await sb.auth.getUser()).data.user.id;
  await cleanup();

  // Seed: 1 track, 1 trilha com nome único, 1 card que usa essa trilha mas cujo
  // título/descrição NÃO contêm o nome da trilha (isola a busca por etiqueta).
  const mk = (o) => ({ ...o, user_id: uid });
  const { data: track } = await sb
    .from("tracks")
    .insert(
      mk({
        name: "[E2E-PROBE] Track",
        bg: "#eee",
        border: "#ccc",
        fg: "#111",
        dark_bg: "#222",
        dark_fg: "#ddd",
        order: 950,
      }),
    )
    .select()
    .single();
  const TAGNAME = "ZxqTag";
  const { data: trilha } = await sb
    .from("trilhas")
    .insert(
      mk({
        name: `[E2E-PROBE] ${TAGNAME}`,
        bg: "#fce",
        fg: "#603",
      }),
    )
    .select()
    .single();
  await sb.from("tasks").insert(
    mk({
      title: "[E2E-PROBE] Banana",
      col: "backlog",
      track: track.id,
      type: "Task",
      prio: "Média",
      tags: [trilha.id],
      order: 1,
    }),
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (e) => bad(`pageerror: ${e.message}`));
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 20000 });
  await page.waitForSelector("[data-track]", { timeout: 20000 });

  const searchBox = page.getByPlaceholder(/busc|search/i).first();

  // 1) Busca pelo NOME DA ETIQUETA → card "Banana" deve aparecer (título não tem o termo)
  await searchBox.fill(TAGNAME);
  await page.waitForTimeout(800);
  const byTag = await page
    .locator("[data-card-id]")
    .filter({ hasText: "[E2E-PROBE] Banana" })
    .count();
  if (byTag > 0) ok(`busca por etiqueta "${TAGNAME}" encontra o card`);
  else bad(`busca por etiqueta "${TAGNAME}" NÃO encontrou o card`);

  // 2) Busca por título ainda funciona
  await searchBox.fill("Banana");
  await page.waitForTimeout(800);
  const byTitle = await page
    .locator("[data-card-id]")
    .filter({ hasText: "[E2E-PROBE] Banana" })
    .count();
  if (byTitle > 0) ok("busca por título ainda funciona");
  else bad("busca por título quebrou");

  // 3) Termo inexistente → card some
  await searchBox.fill("QwertyNadaXyz");
  await page.waitForTimeout(800);
  const none = await page
    .locator("[data-card-id]")
    .filter({ hasText: "[E2E-PROBE] Banana" })
    .count();
  if (none === 0) ok("termo inexistente filtra o card corretamente");
  else bad("termo inexistente não filtrou");

  await browser.close();
  await cleanup();
  await sb.auth.signOut();
  console.log(`\n${fail === 0 ? "PROBE GREEN" : "PROBE RED"} (${fail} falhas)`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE CRASH:", e);
  process.exit(1);
});
