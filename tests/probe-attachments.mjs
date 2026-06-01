// Probe do Bloco 4 — Anexos: valida o ciclo upload → persiste → delete remove
// o arquivo do STORAGE (não só a row), exercitando as DUAS camadas de RLS
// (tabela public.attachments + storage.objects) com a sessão real do usuário.
//
// Faz login interativo (mesma razão dos outros probes: storageState não
// restaura sessão — ver memory project_session_restore). Depois pega o
// access_token da sessão no localStorage e dirige Storage + REST direto pelos
// endpoints do Supabase, com o JWT do usuário (mesma RLS que o app aplica).
//
// Critério graduado do prompt: a remoção tem que limpar o arquivo do storage.
//
// Uso: node tests/probe-attachments.mjs   (dev server em :5174)

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
const bad = (m) => { console.log(`  ✗ ${m}`); fail++; };

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (e) => bad(`pageerror: ${e.message}`));

  // ── Login interativo ──
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 20000 });
  await page.waitForSelector("[data-track]", { timeout: 20000 });
  ok("login → board carregado");

  // Roda todo o ciclo DENTRO da página, com o JWT real do usuário.
  const result = await page.evaluate(
    async ({ SUPA_URL, ANON }) => {
      // 1) extrai a sessão do localStorage (chave sb-<ref>-auth-token)
      const key = Object.keys(localStorage).find(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
      );
      if (!key) return { error: "sessão não encontrada no localStorage" };
      const sess = JSON.parse(localStorage.getItem(key));
      const token = sess.access_token;
      const userId = sess.user?.id;
      if (!token || !userId) return { error: "token/userId ausentes" };

      const H = { apikey: ANON, Authorization: `Bearer ${token}` };
      const log = [];

      // 2) precisa de um card real para o FK task_id → pega um do usuário
      const tasksRes = await fetch(
        `${SUPA_URL}/rest/v1/tasks?select=id&limit=1`,
        { headers: H },
      );
      const tasks = await tasksRes.json();
      if (!Array.isArray(tasks) || tasks.length === 0)
        return { error: "nenhum card para anexar" };
      const cardId = tasks[0].id;
      log.push(`card alvo: ${cardId}`);

      const bytes = new TextEncoder().encode("probe-attachment-content-" + Date.now());
      const path = `${cardId}/${crypto.randomUUID()}-probe.txt`;

      // 3) UPLOAD para o storage
      const upRes = await fetch(
        `${SUPA_URL}/storage/v1/object/attachments/${path}`,
        { method: "POST", headers: { ...H, "Content-Type": "text/plain" }, body: bytes },
      );
      log.push(`upload status: ${upRes.status}`);
      if (!upRes.ok) return { error: `upload falhou (${upRes.status})`, log };

      // 4) INSERT da row de metadados
      const insRes = await fetch(`${SUPA_URL}/rest/v1/attachments`, {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          task_id: cardId, user_id: userId, path,
          name: "probe.txt", mime: "text/plain", size_bytes: bytes.length,
        }),
      });
      log.push(`insert status: ${insRes.status}`);
      if (!insRes.ok) {
        // rollback do objeto p/ não orfanar
        await fetch(`${SUPA_URL}/storage/v1/object/attachments/${path}`, { method: "DELETE", headers: H });
        return { error: `insert falhou (${insRes.status})`, log };
      }
      const rows = await insRes.json();
      const attId = rows[0].id;

      // 5) PERSISTE? re-fetch da row (simula reabrir o card / reload)
      const reRes = await fetch(
        `${SUPA_URL}/rest/v1/attachments?select=*&task_id=eq.${cardId}&path=eq.${encodeURIComponent(path)}`,
        { headers: H },
      );
      const reRows = await reRes.json();
      const persisted = Array.isArray(reRows) && reRows.length === 1;
      log.push(`persistiu na tabela: ${persisted}`);

      // objeto baixável (bucket público)?
      const dlRes = await fetch(`${SUPA_URL}/storage/v1/object/public/attachments/${path}`);
      log.push(`download antes do delete: ${dlRes.status}`);
      const downloadable = dlRes.ok;

      // 6) DELETE — storage primeiro, depois a row (igual ao service)
      const rmRes = await fetch(
        `${SUPA_URL}/storage/v1/object/attachments/${path}`,
        { method: "DELETE", headers: H },
      );
      log.push(`storage remove status: ${rmRes.status}`);
      await fetch(`${SUPA_URL}/rest/v1/attachments?id=eq.${attId}`, { method: "DELETE", headers: H });

      // 7) CONFIRMA que o arquivo SUMIU do storage (critério graduado)
      const dlAfter = await fetch(`${SUPA_URL}/storage/v1/object/public/attachments/${path}`);
      log.push(`download depois do delete: ${dlAfter.status}`);
      const goneFromStorage = !dlAfter.ok;

      // e que a row sumiu
      const rowAfter = await fetch(
        `${SUPA_URL}/rest/v1/attachments?select=id&id=eq.${attId}`,
        { headers: H },
      );
      const rowsAfter = await rowAfter.json();
      const goneFromTable = Array.isArray(rowsAfter) && rowsAfter.length === 0;

      return { persisted, downloadable, goneFromStorage, goneFromTable, log };
    },
    { SUPA_URL, ANON },
  );

  if (result.error) {
    bad(`ciclo falhou: ${result.error}`);
    if (result.log) result.log.forEach((l) => console.log(`      · ${l}`));
  } else {
    result.log.forEach((l) => console.log(`      · ${l}`));
    result.persisted ? ok("anexo persiste na tabela (sobrevive a reabrir/reload)") : bad("anexo NÃO persistiu");
    result.downloadable ? ok("arquivo baixável do storage (bucket público)") : bad("arquivo NÃO baixável");
    result.goneFromStorage ? ok("delete REMOVEU o arquivo do storage (critério graduado)") : bad("arquivo continua no storage após delete");
    result.goneFromTable ? ok("delete removeu a row de metadados") : bad("row continua na tabela após delete");
  }

  await browser.close();
  console.log(`\n${fail === 0 ? "PROBE GREEN" : "PROBE RED"} (${fail} falhas)`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("PROBE CRASH:", e); process.exit(1); });
