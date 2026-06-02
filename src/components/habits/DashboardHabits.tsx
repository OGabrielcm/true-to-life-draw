import { useMemo } from "react";
import { useHabits } from "@/lib/habits-store";
import { useLocale } from "@/lib/locale-context";
import { DEFAULT_HABIT_COLOR } from "@/lib/habit-types";
import { getStreak, getRecordStreak, getMonthlyConsistency, toLogDateSet } from "@/lib/habit-logic";
import { StreakBadge } from "./StreakBadge";
import { HabitHeatmapStrip } from "./HabitHeatmapStrip";

// Seção de hábitos do Dashboard (Bloco 7.1): consistência do mês, heatmap
// agregado de 30 dias e lista com streak atual + recorde por hábito.
// Não renderiza nada se não houver hábitos (evita seção quebrada).
export function DashboardHabits() {
  const { habits, logsByHabit, loading } = useHabits();
  const { t } = useLocale();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const consistency = useMemo(
    () => getMonthlyConsistency(habits, logsByHabit, today),
    [habits, logsByHabit, today],
  );

  // Enquanto carrega ou sem hábitos: não mostra a seção.
  if (loading || habits.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">{t("habits_section")}</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* KPI: consistência do mês */}
        <div className="rounded-xl border bg-card p-4" style={{ borderWidth: "0.5px" }}>
          <div className="text-2xl font-bold text-foreground">
            {consistency === null ? "—" : `${consistency}%`}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{t("habit_consistency")}</div>
          {consistency !== null && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all"
                style={{ width: `${consistency}%` }}
              />
            </div>
          )}
        </div>

        {/* Heatmap agregado 30 dias (ocupa 2 colunas no sm+) */}
        <div
          className="rounded-xl border bg-card p-4 sm:col-span-2"
          style={{ borderWidth: "0.5px" }}
        >
          <p className="mb-3 text-xs font-medium text-muted-foreground">{t("habit_last30")}</p>
          <HabitHeatmapStrip habits={habits} logsByHabit={logsByHabit} today={today} />
        </div>
      </div>

      {/* Lista de hábitos: streak atual + recorde */}
      <div className="rounded-xl border bg-card p-4" style={{ borderWidth: "0.5px" }}>
        <div className="space-y-2">
          {habits.map((h) => {
            const logSet = toLogDateSet(logsByHabit[h.id] ?? []);
            const created = new Date(h.created_at);
            created.setHours(0, 0, 0, 0);
            const current = getStreak(logSet, h.frequency, today);
            const record = getRecordStreak(logSet, h.frequency, today, created);
            const color = h.color ?? DEFAULT_HABIT_COLOR;
            return (
              <div key={h.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-foreground">{h.name}</span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StreakBadge count={current} color={color} title={t("habit_streak")} />
                  <span className="text-[11px] text-muted-foreground">
                    {t("habit_record")} {record}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
