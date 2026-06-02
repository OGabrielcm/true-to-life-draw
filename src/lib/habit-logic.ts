// Habit Tracker — lógica pura (streak + estado de dia para o heatmap).
//
// Funções PURAS e determinísticas: `today` é sempre parâmetro (nunca
// `new Date()` interno), para serem testáveis sem mockar o relógio.
//
// Streak v1 = dias AGENDADOS consecutivos com log, contando para trás a partir
// de hoje. Um hábito seg/qua/sex não "quebra" no sábado: dias não-agendados são
// pulados. Hoje, se agendado e ainda sem log, é PENDENTE (não conta, não quebra).

import type { Frequency, Weekday, Habit, HabitLog } from "./habit-types";
import { toLocalIso, addDays, isSameDay, startOfMonth } from "./date-utils";

// O hábito é agendado neste dia?
export function isScheduled(frequency: Frequency, date: Date): boolean {
  switch (frequency.type) {
    case "daily":
      return true;
    case "weekdays":
      return frequency.days.includes(date.getDay() as Weekday);
  }
}

export type DayState = "done" | "missed" | "off";

// Estado de um dia para o heatmap:
//  • "done"   → agendado e com log
//  • "missed" → agendado e sem log (já passou)
//  • "off"    → não agendado
// (hoje sem log conta como "off"/pendente na cor — ver getDayState abaixo)
export function getDayState(
  logDates: Set<string>,
  frequency: Frequency,
  date: Date,
  today: Date,
  createdAt?: Date,
): DayState {
  if (!isScheduled(frequency, date)) return "off";
  if (logDates.has(toLocalIso(date))) return "done";
  // Antes da criação do hábito não há "falha" — o hábito nem existia.
  if (createdAt && date.getTime() < createdAt.getTime() && !isSameDay(date, createdAt))
    return "off";
  // dia agendado sem log: só é "missed" se já passou (antes de hoje).
  // hoje (e futuro) sem log = pendente, exibido como "off" no heatmap.
  if (date.getTime() < today.getTime() && !isSameDay(date, today)) return "missed";
  return "off";
}

// Streak: dias agendados consecutivos com log, para trás a partir de hoje.
// Para no primeiro dia AGENDADO sem log que já passou. Hoje sem log é pendente.
export function getStreak(logDates: Set<string>, frequency: Frequency, today: Date): number {
  let streak = 0;
  let cursor = new Date(today);
  // Limite de segurança: ~2 anos de varredura para trás.
  for (let guard = 0; guard < 800; guard++) {
    const isToday = isSameDay(cursor, today);
    if (isScheduled(frequency, cursor)) {
      if (logDates.has(toLocalIso(cursor))) {
        streak++;
      } else if (!isToday) {
        // dia agendado passado sem log → quebra o streak.
        break;
      }
      // hoje agendado sem log: pendente, não conta nem quebra → continua.
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// Helper: monta o Set de datas ISO a partir dos logs (para lookup O(1)).
export function toLogDateSet(logs: { date: string }[]): Set<string> {
  return new Set(logs.map((l) => l.date));
}

// Recorde de streak: a MAIOR sequência de dias agendados consecutivos com log
// que já existiu. Varre para FRENTE de createdAt (ou ~1 ano atrás) até hoje:
//  • dia agendado com log → run++ e atualiza o máximo
//  • dia agendado passado SEM log → zera run
//  • hoje agendado sem log → pendente: mantém run (igual a getStreak)
// Invariante: record >= current streak.
export function getRecordStreak(
  logDates: Set<string>,
  frequency: Frequency,
  today: Date,
  createdAt?: Date,
): number {
  const start = createdAt ? new Date(createdAt) : addDays(today, -365);
  start.setHours(0, 0, 0, 0);
  let run = 0;
  let max = 0;
  let cursor = new Date(start);
  for (let guard = 0; guard < 800 && cursor.getTime() <= today.getTime(); guard++) {
    if (isScheduled(frequency, cursor)) {
      const isToday = isSameDay(cursor, today);
      if (logDates.has(toLocalIso(cursor))) {
        run++;
        if (run > max) max = run;
      } else if (!isToday) {
        run = 0;
      }
      // hoje agendado sem log: pendente — não zera nem conta.
    }
    cursor = addDays(cursor, 1);
  }
  return max;
}

// % de consistência do mês: dias do mês (1 → hoje, INCLUI hoje) em que ≥1 hábito
// agendado foi feito ÷ dias em que ≥1 hábito estava agendado. Um hábito só conta
// nos dias agendados a partir do seu created_at (não retro-penaliza). Sem dias
// agendados no período → null (UI mostra "—", nunca NaN%).
export function getMonthlyConsistency(
  habits: Habit[],
  logsByHabit: Record<string, HabitLog[]>,
  today: Date,
): number | null {
  const monthStart = startOfMonth(today);
  const sets = new Map<string, Set<string>>();
  const createdAts = new Map<string, Date>();
  for (const h of habits) {
    sets.set(h.id, toLogDateSet(logsByHabit[h.id] ?? []));
    const c = new Date(h.created_at);
    c.setHours(0, 0, 0, 0);
    createdAts.set(h.id, c);
  }

  let scheduledDays = 0;
  let doneDays = 0;
  let cursor = new Date(monthStart);
  while (cursor.getTime() <= today.getTime()) {
    let anyScheduled = false;
    let anyDone = false;
    const iso = toLocalIso(cursor);
    for (const h of habits) {
      const createdAt = createdAts.get(h.id)!;
      const existed = cursor.getTime() >= createdAt.getTime() || isSameDay(cursor, createdAt);
      if (existed && isScheduled(h.frequency, cursor)) {
        anyScheduled = true;
        if (sets.get(h.id)!.has(iso)) anyDone = true;
      }
    }
    if (anyScheduled) {
      scheduledDays++;
      if (anyDone) doneDays++;
    }
    cursor = addDays(cursor, 1);
  }

  if (scheduledDays === 0) return null;
  return Math.round((doneDays / scheduledDays) * 100);
}

// Conta, por data ISO, quantos hábitos têm log naquele dia (numa passada).
// Alimenta o heatmap AGREGADO (intensidade = nº de hábitos feitos no dia).
export function aggregateLogCountsByDate(
  habits: Habit[],
  logsByHabit: Record<string, HabitLog[]>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const h of habits) {
    for (const log of logsByHabit[h.id] ?? []) {
      counts.set(log.date, (counts.get(log.date) ?? 0) + 1);
    }
  }
  return counts;
}
