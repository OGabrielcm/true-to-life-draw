import { describe, it, expect } from "vitest";
import {
  isScheduled,
  getDayState,
  getStreak,
  getRecordStreak,
  getMonthlyConsistency,
  aggregateLogCountsByDate,
  toLogDateSet,
} from "./habit-logic";
import { toLocalIso } from "./date-utils";
import type { Frequency, Habit, HabitLog } from "./habit-types";

// ── Helpers ──────────────────────────────────────────────────────────────────
// Datas LOCAIS via construtor (y, mIndex, d) — sem timezone shift.
// Junho/2025: dia 1 = domingo. Logo 16=Seg, 13=Sex, 11=Qua, 9=Seg, 17=Ter.
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const TODAY = d(2025, 6, 16); // segunda-feira
const set = (...dates: Date[]) => new Set(dates.map(toLocalIso));

const DAILY: Frequency = { type: "daily" };
const MWF: Frequency = { type: "weekdays", days: [1, 3, 5] }; // seg/qua/sex

function makeHabit(o: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    user_id: "u1",
    name: "Hábito",
    frequency: DAILY,
    archived: false,
    created_at: "2025-06-01T12:00:00", // local, evita shift de tz
    ...o,
  };
}
function makeLog(habitId: string, date: Date): HabitLog {
  return {
    id: `${habitId}-${toLocalIso(date)}`,
    habit_id: habitId,
    user_id: "u1",
    date: toLocalIso(date),
    created_at: "2025-06-01T12:00:00",
  };
}

// ── isScheduled ───────────────────────────────────────────────────────────────

describe("isScheduled", () => {
  it("daily é sempre agendado", () => {
    expect(isScheduled(DAILY, d(2025, 6, 16))).toBe(true); // seg
    expect(isScheduled(DAILY, d(2025, 6, 14))).toBe(true); // sáb
  });
  it("weekdays respeita os dias da semana", () => {
    expect(isScheduled(MWF, d(2025, 6, 16))).toBe(true); // seg
    expect(isScheduled(MWF, d(2025, 6, 11))).toBe(true); // qua
    expect(isScheduled(MWF, d(2025, 6, 17))).toBe(false); // ter
    expect(isScheduled(MWF, d(2025, 6, 14))).toBe(false); // sáb
  });
});

// ── getDayState ───────────────────────────────────────────────────────────────

describe("getDayState", () => {
  it("'off' quando não agendado", () => {
    expect(getDayState(set(), MWF, d(2025, 6, 17), TODAY)).toBe("off"); // terça
  });
  it("'done' quando agendado e com log", () => {
    const day = d(2025, 6, 13);
    expect(getDayState(set(day), DAILY, day, TODAY)).toBe("done");
  });
  it("'missed' quando agendado, sem log e já passou", () => {
    expect(getDayState(set(), DAILY, d(2025, 6, 13), TODAY)).toBe("missed");
  });
  it("hoje sem log é pendente ('off', não 'missed')", () => {
    expect(getDayState(set(), DAILY, TODAY, TODAY)).toBe("off");
  });
  it("futuro sem log é 'off'", () => {
    expect(getDayState(set(), DAILY, d(2025, 6, 20), TODAY)).toBe("off");
  });
  it("antes do createdAt é 'off' (hábito não existia)", () => {
    const createdAt = d(2025, 6, 10);
    // dia 5 é agendado (daily), passado e sem log, mas anterior ao createdAt.
    expect(getDayState(set(), DAILY, d(2025, 6, 5), TODAY, createdAt)).toBe("off");
  });
  it("no dia do createdAt ainda pode ser 'missed'", () => {
    const createdAt = d(2025, 6, 10);
    expect(getDayState(set(), DAILY, d(2025, 6, 10), TODAY, createdAt)).toBe("missed");
  });
});

// ── getStreak ─────────────────────────────────────────────────────────────────

describe("getStreak", () => {
  it("conta dias consecutivos com log, incluindo hoje", () => {
    expect(getStreak(set(d(2025, 6, 16), d(2025, 6, 15), d(2025, 6, 14)), DAILY, TODAY)).toBe(3);
  });
  it("hoje sem log não quebra (pendente) — conta os anteriores", () => {
    expect(getStreak(set(d(2025, 6, 15), d(2025, 6, 14)), DAILY, TODAY)).toBe(2);
  });
  it("dia passado agendado sem log quebra o streak", () => {
    // hoje logado (1), ontem (15) sem log → quebra.
    expect(getStreak(set(d(2025, 6, 16)), DAILY, TODAY)).toBe(1);
  });
  it("sem nenhum log → 0", () => {
    expect(getStreak(set(), DAILY, TODAY)).toBe(0);
  });
  it("weekdays pula dias não agendados sem quebrar", () => {
    // seg16, sex13, qua11, seg9 logados; sáb/dom/ter entre eles são pulados.
    const logs = set(d(2025, 6, 16), d(2025, 6, 13), d(2025, 6, 11), d(2025, 6, 9));
    expect(getStreak(logs, MWF, TODAY)).toBe(4);
  });
});

// ── getRecordStreak ───────────────────────────────────────────────────────────

describe("getRecordStreak", () => {
  const createdAt = d(2025, 6, 9);
  it("retorna a maior sequência histórica, não a atual", () => {
    // 9,10,11,12 (run 4) → gap 13 → 15,16 (run 2). Record = 4.
    const logs = set(
      d(2025, 6, 9),
      d(2025, 6, 10),
      d(2025, 6, 11),
      d(2025, 6, 12),
      d(2025, 6, 15),
      d(2025, 6, 16),
    );
    expect(getRecordStreak(logs, DAILY, TODAY, createdAt)).toBe(4);
    // sanity: a atual é menor (14 sem log quebra).
    expect(getStreak(logs, DAILY, TODAY)).toBe(2);
  });
  it("hoje sem log (pendente) não zera o run", () => {
    const logs = set(d(2025, 6, 14), d(2025, 6, 15)); // não inclui hoje (16)
    expect(getRecordStreak(logs, DAILY, TODAY, d(2025, 6, 14))).toBe(2);
  });
  it("sem logs → 0", () => {
    expect(getRecordStreak(set(), DAILY, TODAY, createdAt)).toBe(0);
  });
});

// ── getMonthlyConsistency ─────────────────────────────────────────────────────

describe("getMonthlyConsistency", () => {
  it("não retro-penaliza dias anteriores ao createdAt", () => {
    // Criado dia 14 → agendado 14,15,16 (3 dias). Logs em 14 e 16 → 2/3 = 67%.
    const habit = makeHabit({ created_at: "2025-06-14T12:00:00" });
    const logs = { h1: [makeLog("h1", d(2025, 6, 14)), makeLog("h1", d(2025, 6, 16))] };
    expect(getMonthlyConsistency([habit], logs, TODAY)).toBe(67);
  });
  it("retorna null quando não há dias agendados no período", () => {
    // Criado hoje (seg 16), agendado só às terças → nenhuma terça em [16,16].
    const habit = makeHabit({
      created_at: "2025-06-16T12:00:00",
      frequency: { type: "weekdays", days: [2] },
    });
    expect(getMonthlyConsistency([habit], { h1: [] }, TODAY)).toBeNull();
  });
  it("um dia conta como feito se QUALQUER hábito agendado foi feito", () => {
    const h1 = makeHabit({ id: "h1", created_at: "2025-06-16T12:00:00" });
    const h2 = makeHabit({ id: "h2", created_at: "2025-06-16T12:00:00" });
    // Só h1 logado hoje; ambos agendados → dia conta como done → 100%.
    const logs = { h1: [makeLog("h1", TODAY)], h2: [] };
    expect(getMonthlyConsistency([h1, h2], logs, TODAY)).toBe(100);
  });
});

// ── toLogDateSet / aggregateLogCountsByDate ───────────────────────────────────

describe("toLogDateSet", () => {
  it("vira um Set de datas para lookup O(1)", () => {
    const s = toLogDateSet([{ date: "2025-06-16" }, { date: "2025-06-15" }]);
    expect(s.has("2025-06-16")).toBe(true);
    expect(s.has("2025-06-01")).toBe(false);
    expect(s.size).toBe(2);
  });
});

describe("aggregateLogCountsByDate", () => {
  it("soma os logs de todos os hábitos por data", () => {
    const habits = [makeHabit({ id: "h1" }), makeHabit({ id: "h2" })];
    const logs = {
      h1: [makeLog("h1", d(2025, 6, 16)), makeLog("h1", d(2025, 6, 15))],
      h2: [makeLog("h2", d(2025, 6, 16))],
    };
    const counts = aggregateLogCountsByDate(habits, logs);
    expect(counts.get("2025-06-16")).toBe(2); // h1 + h2
    expect(counts.get("2025-06-15")).toBe(1);
  });
});
