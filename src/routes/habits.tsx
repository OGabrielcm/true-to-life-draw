import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Check, Flame } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useHabits } from "@/lib/habits-store";
import { useLocale } from "@/lib/locale-context";
import type { Habit } from "@/lib/habit-types";
import { isScheduled, getStreak, toLogDateSet } from "@/lib/habit-logic";
import { toLocalIso } from "@/lib/date-utils";

export const Route = createFileRoute("/habits")({
  component: HabitsPage,
  head: () => ({ meta: [{ title: "Hábitos — Molas" }] }),
});

function HabitsPage() {
  const { habits, logsByHabit, toggleLog } = useHabits();
  const { t } = useLocale();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("habits_title")}</h2>
        </div>

        {habits.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            {t("habit_empty")}
          </p>
        ) : (
          <div className="space-y-2">
            {habits.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                logs={logsByHabit[h.id] ?? []}
                today={today}
                onToggleToday={() => toggleLog(h.id, toLocalIso(today))}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function HabitRow({
  habit,
  logs,
  today,
  onToggleToday,
}: {
  habit: Habit;
  logs: { date: string }[];
  today: Date;
  onToggleToday: () => void;
}) {
  const { t } = useLocale();
  const logSet = toLogDateSet(logs);
  const streak = getStreak(logSet, habit.frequency, today);
  const scheduledToday = isScheduled(habit.frequency, today);
  const doneToday = logSet.has(toLocalIso(today));
  const color = habit.color ?? "#3b82f6";

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
      {/* Check de hoje — só clicável se agendado hoje */}
      <button
        onClick={onToggleToday}
        disabled={!scheduledToday}
        aria-label={t("habit_today")}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-30"
        style={{
          borderColor: color,
          backgroundColor: doneToday ? color : "transparent",
        }}
      >
        {doneToday && <Check className="h-4 w-4 text-white" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{habit.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {habit.frequency.type === "daily" ? t("habit_freq_daily") : t("habit_freq_weekdays")}
        </p>
      </div>

      {/* Badge de streak */}
      {streak > 0 && (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${color}1a`, color }}
          title={t("habit_streak")}
        >
          <Flame className="h-3 w-3" />
          {streak}
        </span>
      )}
    </div>
  );
}
