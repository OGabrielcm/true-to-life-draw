import { useMemo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { useHabits } from "@/lib/habits-store";
import { useLocale } from "@/lib/locale-context";
import { DEFAULT_HABIT_COLOR } from "@/lib/habit-types";
import { isScheduled, getStreak, toLogDateSet } from "@/lib/habit-logic";
import { toLocalIso } from "@/lib/date-utils";

const STREAK_RISK_THRESHOLD = 2; // streak ativo ≥2 dias dispara o alerta

// Bloco contextual de hábitos no For You (Bloco 7.2): contagem do dia +
// pendentes + alerta de streak em risco. Não renderiza sem hábitos.
export function ForYouHabits() {
  const { habits, logsByHabit, loading, toggleLog } = useHabits();
  const { t } = useLocale();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayIso = toLocalIso(today);

  const { scheduledToday, doneToday, pending, atRisk } = useMemo(() => {
    const scheduled = habits.filter((h) => isScheduled(h.frequency, today));
    const done = scheduled.filter((h) => toLogDateSet(logsByHabit[h.id] ?? []).has(todayIso));
    const pend = scheduled.filter((h) => !toLogDateSet(logsByHabit[h.id] ?? []).has(todayIso));
    // streak em risco: pendente hoje E streak atual ≥ limiar.
    const risk = pend
      .map((h) => ({
        habit: h,
        streak: getStreak(toLogDateSet(logsByHabit[h.id] ?? []), h.frequency, today),
      }))
      .filter((x) => x.streak >= STREAK_RISK_THRESHOLD);
    return { scheduledToday: scheduled, doneToday: done, pending: pend, atRisk: risk };
  }, [habits, logsByHabit, today, todayIso]);

  if (loading || habits.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">{t("habit_today_progress")}</h2>

      {/* Alertas de streak em risco */}
      {atRisk.map(({ habit, streak }) => (
        <div
          key={habit.id}
          className="mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          style={{
            borderWidth: "0.5px",
            backgroundColor: "rgb(245 158 11 / 0.1)",
            borderColor: "rgb(245 158 11 / 0.4)",
          }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="text-foreground">
            {t("habit_streak_risk").replace("{n}", String(streak)).replace("{name}", habit.name)}
          </span>
        </div>
      ))}

      {scheduledToday.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("habit_none_today")}</p>
      ) : pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("habit_all_done_today")}</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground">
            {doneToday.length} {t("habit_today_done")} · {pending.length} {t("habit_today_left")}
          </p>
          <div className="space-y-1.5">
            {pending.map((h) => {
              const color = h.color ?? DEFAULT_HABIT_COLOR;
              return (
                <div
                  key={h.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                  style={{ borderWidth: "0.5px" }}
                >
                  <button
                    onClick={() => toggleLog(h.id, todayIso)}
                    aria-label={t("habit_today")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                    style={{ borderColor: color }}
                  >
                    <Check className="h-4 w-4 opacity-0" />
                  </button>
                  <span className="truncate text-sm text-foreground">{h.name}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
