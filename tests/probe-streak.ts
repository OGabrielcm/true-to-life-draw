// Probe da lógica pura do habit tracker (Fase 2). Sem browser/DB — testa
// getStreak / isScheduled / getDayState com asserts. Node v24 faz type-strip
// nativo, então roda direto: `node tests/probe-streak.ts`.
//
// RED→GREEN: rodar antes de implementar deve falhar; depois deve passar.

import {
  getStreak,
  isScheduled,
  getDayState,
  toLogDateSet,
  getRecordStreak,
  getMonthlyConsistency,
  aggregateLogCountsByDate,
} from "../src/lib/habit-logic.ts";
import type { Frequency, Habit, HabitLog } from "../src/lib/habit-types.ts";
import { toLocalIso } from "../src/lib/date-utils.ts";

let fail = 0;
const eq = (got: unknown, want: unknown, msg: string) => {
  if (got === want) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.log(`  ✗ ${msg} — esperado ${want}, obtido ${got}`);
    fail++;
  }
};

// Helper: data local a partir de yyyy-mm-dd
const D = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
// Helper: gera Set de ISOs de uma lista de yyyy-mm-dd
const logs = (...isos: string[]) => new Set(isos);

const daily: Frequency = { type: "daily" };
// seg(1)/qua(3)/sex(5)
const mwf: Frequency = { type: "weekdays", days: [1, 3, 5] };

// 2026-06-01 é uma segunda-feira.
const monday = D("2026-06-01");

console.log("── isScheduled ──");
eq(isScheduled(daily, monday), true, "daily é agendado em qualquer dia");
eq(isScheduled(mwf, D("2026-06-01")), true, "mwf agendado na segunda");
eq(isScheduled(mwf, D("2026-06-02")), false, "mwf NÃO agendado na terça");
eq(isScheduled(mwf, D("2026-06-03")), true, "mwf agendado na quarta");

console.log("\n── getStreak: daily ──");
// hoje = qui 2026-06-04; logs nos 3 dias anteriores + nada hoje ainda
eq(
  getStreak(logs("2026-06-01", "2026-06-02", "2026-06-03"), daily, D("2026-06-04")),
  3,
  "daily: 3 dias seguidos, hoje pendente → streak 3",
);
// hoje também feito
eq(
  getStreak(logs("2026-06-02", "2026-06-03", "2026-06-04"), daily, D("2026-06-04")),
  3,
  "daily: inclui hoje feito → streak 3",
);
// furo ontem quebra
eq(
  getStreak(logs("2026-06-01", "2026-06-04"), daily, D("2026-06-04")),
  1,
  "daily: furo em 02-03, só hoje feito → streak 1",
);
// nada feito, hoje pendente
eq(getStreak(logs(), daily, D("2026-06-04")), 0, "daily: nada feito → streak 0");

console.log("\n── getStreak: weekdays (mwf) — pular folga não quebra ──");
// seg/qua/sex feitos; hoje = sáb 2026-06-06 (não agendado) → streak conta seg+qua+sex
eq(
  getStreak(logs("2026-06-01", "2026-06-03", "2026-06-05"), mwf, D("2026-06-06")),
  3,
  "mwf: seg+qua+sex feitos, sáb não agendado → streak 3 (folga não quebra)",
);
// falta a sexta (dia agendado passado sem log) → quebra; conta seg+qua... espera: anda de trás
// hoje sáb, sex(05) agendado SEM log → quebra imediatamente → streak 0
eq(
  getStreak(logs("2026-06-01", "2026-06-03"), mwf, D("2026-06-06")),
  0,
  "mwf: sex passada sem log quebra antes de contar → streak 0",
);
// hoje = sex 2026-06-05 agendada e ainda sem log (pendente); seg+qua feitos
eq(
  getStreak(logs("2026-06-01", "2026-06-03"), mwf, D("2026-06-05")),
  2,
  "mwf: hoje(sex) pendente não quebra; seg+qua → streak 2",
);

console.log("\n── getDayState (heatmap) ──");
const set = toLogDateSet([{ date: "2026-06-01" }]);
eq(getDayState(set, mwf, D("2026-06-01"), D("2026-06-06")), "done", "seg com log → done");
eq(
  getDayState(set, mwf, D("2026-06-03"), D("2026-06-06")),
  "missed",
  "qua sem log (passada) → missed",
);
eq(getDayState(set, mwf, D("2026-06-02"), D("2026-06-06")), "off", "ter não agendada → off");
eq(getDayState(set, mwf, D("2026-06-06"), D("2026-06-06")), "off", "sáb hoje não agendado → off");
// hoje agendado sem log = pendente (off), não missed
eq(
  getDayState(new Set<string>(), daily, D("2026-06-06"), D("2026-06-06")),
  "off",
  "hoje agendado sem log → off (pendente, não missed)",
);
// dia ANTES da criação do hábito não é "missed" (o hábito nem existia)
eq(
  getDayState(new Set<string>(), daily, D("2026-06-01"), D("2026-06-06"), D("2026-06-05")),
  "off",
  "dia anterior à criação → off (não missed)",
);
// dia após a criação, agendado e sem log, segue "missed"
eq(
  getDayState(new Set<string>(), daily, D("2026-06-05"), D("2026-06-06"), D("2026-06-04")),
  "missed",
  "dia após criação, passado sem log → missed",
);

// sanity: toLocalIso
eq(toLocalIso(D("2026-06-01")), "2026-06-01", "toLocalIso formata local sem timezone");

// ── Bloco 7: getRecordStreak ──
console.log("\n── getRecordStreak ──");
// daily, criado 06-01, hoje 06-06. logs 01,02,03 (run 3), furo 04, log 05 (run 1),
// hoje 06 pendente. record = 3, current = 1.
{
  const created = D("2026-06-01");
  const set = logs("2026-06-01", "2026-06-02", "2026-06-03", "2026-06-05");
  eq(getRecordStreak(set, daily, D("2026-06-06"), created), 3, "record = maior sequência (3)");
  eq(getStreak(set, daily, D("2026-06-06")), 1, "current = 1 (só 05; hoje pendente)");
}
// sem furo: record == current
{
  const created = D("2026-06-01");
  const set = logs("2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05");
  const rec = getRecordStreak(set, daily, D("2026-06-06"), created);
  const cur = getStreak(set, daily, D("2026-06-06"));
  eq(rec, 5, "record = 5 sem furo");
  eq(rec >= cur, true, "invariante record >= current");
}
// nada feito → record 0
eq(
  getRecordStreak(new Set<string>(), daily, D("2026-06-06"), D("2026-06-01")),
  0,
  "record 0 sem logs",
);

// ── getMonthlyConsistency ──
console.log("\n── getMonthlyConsistency ──");
const mkHabit = (id: string, freq: Frequency, created: string): Habit => ({
  id,
  user_id: "u",
  name: id,
  frequency: freq,
  archived: false,
  // meio-dia LOCAL (sem Z) — não cruza fronteira de dia em nenhum fuso, então
  // o dia de criação local é exatamente `created` (igual a como os logs são
  // gravados via toLocalIso). Usar Z aqui daria off-by-one em fusos negativos.
  created_at: `${created}T12:00:00`,
});
const mkLogs = (id: string, ...dates: string[]): HabitLog[] =>
  dates.map((date, i) => ({ id: `${id}-${i}`, habit_id: id, user_id: "u", date, created_at: "" }));
{
  // 1 hábito daily criado 06-01; hoje 06-05. agendado 01-05 (5 dias). feito 01,02,03.
  // dias com algo feito = 3, dias agendados = 5 → 60%.
  const habits = [mkHabit("h1", daily, "2026-06-01")];
  const lbh = { h1: mkLogs("h1", "2026-06-01", "2026-06-02", "2026-06-03") };
  eq(getMonthlyConsistency(habits, lbh, D("2026-06-05")), 60, "consistência 3/5 = 60%");
}
{
  // hábito criado no MEIO do mês (06-04); hoje 06-05. só conta 04,05 (2 dias). feito 04.
  // → 1/2 = 50% (não retro-penaliza 01-03).
  const habits = [mkHabit("h2", daily, "2026-06-04")];
  const lbh = { h2: mkLogs("h2", "2026-06-04") };
  eq(getMonthlyConsistency(habits, lbh, D("2026-06-05")), 50, "criado no meio: 1/2 = 50%");
}
{
  // sem hábitos agendados → null
  eq(getMonthlyConsistency([], {}, D("2026-06-05")), null, "sem hábitos → null");
}

// ── aggregateLogCountsByDate ──
console.log("\n── aggregateLogCountsByDate ──");
{
  const habits = [mkHabit("a", daily, "2026-06-01"), mkHabit("b", daily, "2026-06-01")];
  const lbh = {
    a: mkLogs("a", "2026-06-01", "2026-06-02"),
    b: mkLogs("b", "2026-06-01"),
  };
  const m = aggregateLogCountsByDate(habits, lbh);
  eq(m.get("2026-06-01"), 2, "01: 2 hábitos feitos");
  eq(m.get("2026-06-02"), 1, "02: 1 hábito feito");
  eq(m.get("2026-06-03"), undefined, "03: nenhum");
}

console.log(`\n${fail === 0 ? "PROBE GREEN" : "PROBE RED"} (${fail} falhas)`);
process.exit(fail === 0 ? 0 : 1);
