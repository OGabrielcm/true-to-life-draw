// Probe do data-layer de hábitos (Fase 3): login interativo → cria hábito via
// REST com o JWT do usuário → toggle de log (insere) → fetch confirma → toggle
// de novo (remove) → confirma sumiço. Exercita as duas tabelas + RLS per-user.
//
// Uso: node tests/probe-habits.mjs   (dev server em :5174)

import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:5174";
const testEnv = readFileSync(new URL("../.env.test", import.meta.url), "utf8");
const appEnv = readFileSync(new URL("../.env", import.meta.url), "utf8");
const EMAIL = testEnv.match(/TEST_EMAIL=(.*)/)[1].trim();
const PASSWORD = testEnv.match(/TEST_PASSWORD=(.*)/)[1].trim();
const SUPA_URL = appEnv.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const ANON = appEnv.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

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
  await page.waitForSelector("[data-track]", { timeout: 20000 });
  ok("login");

  const result = await page.evaluate(
    async ({ SUPA_URL, ANON }) => {
      const key = Object.keys(localStorage).find(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
      );
      if (!key) return { error: "sessão não encontrada" };
      const sess = JSON.parse(localStorage.getItem(key));
      const token = sess.access_token;
      const userId = sess.user?.id;
      if (!token || !userId) return { error: "token/userId ausentes" };
      const H = { apikey: ANON, Authorization: `Bearer ${token}` };
      const log = [];

      // 1) cria hábito
      const insH = await fetch(`${SUPA_URL}/rest/v1/habits`, {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: userId,
          name: "Probe Habit " + Date.now(),
          color: "#3b82f6",
          frequency: { type: "daily" },
          archived: false,
        }),
      });
      log.push(`insert habit: ${insH.status}`);
      if (!insH.ok) return { error: `insert habit falhou (${insH.status})`, log };
      const habit = (await insH.json())[0];

      // 2) toggle log (marca hoje)
      const today = new Date().toISOString().slice(0, 10);
      const insL = await fetch(`${SUPA_URL}/rest/v1/habit_logs`, {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ habit_id: habit.id, user_id: userId, date: today }),
      });
      log.push(`insert log: ${insL.status}`);
      const logRow = insL.ok ? (await insL.json())[0] : null;

      // 3) fetch confirma persistência
      const fetchL = await fetch(
        `${SUPA_URL}/rest/v1/habit_logs?select=*&habit_id=eq.${habit.id}&date=eq.${today}`,
        { headers: H },
      );
      const logs = await fetchL.json();
      const persisted = Array.isArray(logs) && logs.length === 1;

      // 4) unique constraint: inserir o MESMO dia de novo deve falhar (409)
      const dup = await fetch(`${SUPA_URL}/rest/v1/habit_logs`, {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habit.id, user_id: userId, date: today }),
      });
      log.push(`insert duplicado (espera 409): ${dup.status}`);
      const uniqueEnforced = dup.status === 409;

      // 5) desmarca (delete log) e confirma sumiço
      if (logRow)
        await fetch(`${SUPA_URL}/rest/v1/habit_logs?id=eq.${logRow.id}`, {
          method: "DELETE",
          headers: H,
        });
      const after = await fetch(
        `${SUPA_URL}/rest/v1/habit_logs?select=id&habit_id=eq.${habit.id}&date=eq.${today}`,
        { headers: H },
      );
      const goneLog = (await after.json()).length === 0;

      // 6) cleanup: apaga o hábito (cascade)
      await fetch(`${SUPA_URL}/rest/v1/habits?id=eq.${habit.id}`, { method: "DELETE", headers: H });

      return { persisted, uniqueEnforced, goneLog, log };
    },
    { SUPA_URL, ANON },
  );

  if (result.error) {
    bad(`ciclo falhou: ${result.error}`);
    if (result.log) result.log.forEach((l) => console.log(`      · ${l}`));
  } else {
    result.log.forEach((l) => console.log(`      · ${l}`));
    result.persisted ? ok("log persiste na tabela") : bad("log NÃO persistiu");
    result.uniqueEnforced
      ? ok("unique(habit_id,date) bloqueia duplicado (409)")
      : bad("duplicado NÃO bloqueado");
    result.goneLog ? ok("desmarcar remove o log") : bad("log continua após desmarcar");
  }

  await browser.close();
  console.log(`\n${fail === 0 ? "PROBE GREEN" : "PROBE RED"} (${fail} falhas)`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE CRASH:", e);
  process.exit(1);
});
