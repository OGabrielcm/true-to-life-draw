// Habit Tracker — lógica pura (streak + estado de dia para o heatmap).
//
// Funções PURAS e determinísticas: `today` é sempre parâmetro (nunca
// `new Date()` interno), para serem testáveis sem mockar o relógio.
//
// Streak v1 = dias AGENDADOS consecutivos com log, contando para trás a partir
// de hoje. Um hábito seg/qua/sex não "quebra" no sábado: dias não-agendados são
// pulados. Hoje, se agendado e ainda sem log, é PENDENTE (não conta, não quebra).

import type { Frequency, Weekday } from "./habit-types";
import { toLocalIso, addDays, isSameDay } from "./date-utils";

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
