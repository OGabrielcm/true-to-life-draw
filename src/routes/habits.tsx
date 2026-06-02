import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Check,
  Flame,
  Plus,
  Trash2,
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useHabits } from "@/lib/habits-store";
import { useLocale } from "@/lib/locale-context";
import type { Frequency, Habit, Weekday } from "@/lib/habit-types";
import { HABIT_COLORS, DEFAULT_HABIT_COLOR } from "@/lib/habit-types";
import { isScheduled, getStreak, getDayState, toLogDateSet } from "@/lib/habit-logic";
import {
  toLocalIso,
  startOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  isSameDay,
} from "@/lib/date-utils";

export const Route = createFileRoute("/habits")({
  component: HabitsPage,
  head: () => ({ meta: [{ title: "Hábitos — Molas" }] }),
});

function HabitsPage() {
  const { habits, logsByHabit, toggleLog, deleteHabit } = useHabits();
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);

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
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("habit_add")}
          </button>
        </div>

        {adding && <AddHabitForm onClose={() => setAdding(false)} />}

        {habits.length === 0 && !adding ? (
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
                onDelete={() => {
                  if (confirm(t("habit_delete_confirm"))) deleteHabit(h.id);
                }}
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
  onDelete,
}: {
  habit: Habit;
  logs: { date: string }[];
  today: Date;
  onToggleToday: () => void;
  onDelete: () => void;
}) {
  const { t } = useLocale();
  const [showHistory, setShowHistory] = useState(false);
  const logSet = toLogDateSet(logs);
  const streak = getStreak(logSet, habit.frequency, today);
  const scheduledToday = isScheduled(habit.frequency, today);
  const doneToday = logSet.has(toLocalIso(today));
  const color = habit.color ?? DEFAULT_HABIT_COLOR;

  return (
    <div className="rounded-lg border bg-card">
      <div className="group flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={onToggleToday}
          disabled={!scheduledToday}
          aria-label={t("habit_today")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-30"
          style={{ borderColor: color, backgroundColor: doneToday ? color : "transparent" }}
        >
          {doneToday && <Check className="h-4 w-4 text-white" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{habit.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {habit.frequency.type === "daily" ? t("habit_freq_daily") : t("habit_freq_weekdays")}
          </p>
        </div>

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

        <button
          onClick={() => setShowHistory((v) => !v)}
          aria-label={t("habit_history")}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded hover:bg-muted ${
            showHistory ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
        </button>

        {/* Excluir — visível no mobile, fade no desktop (lição 3.2) */}
        <button
          onClick={onDelete}
          aria-label={t("habit_delete")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 md:opacity-0 md:group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {showHistory && <HabitHeatmap habit={habit} logSet={logSet} today={today} color={color} />}
    </div>
  );
}

// Heatmap mensal por hábito — reusa o grid de 42 dias do calendário (date-utils).
// Cada dia colorido por getDayState: feito (cor) / agendado-sem-log (borda) /
// não-agendado (apagado).
function HabitHeatmap({
  habit,
  logSet,
  today,
  color,
}: {
  habit: Habit;
  logSet: Set<string>;
  today: Date;
  color: string;
}) {
  const { t, locale } = useLocale();
  const [cursor, setCursor] = useState(() => startOfMonth(today));

  const WEEKDAYS =
    locale === "pt" ? ["D", "S", "T", "Q", "Q", "S", "S"] : ["S", "M", "T", "W", "T", "F", "S"];
  const MONTHS_PT = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const MONTHS_EN = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const MONTHS = locale === "pt" ? MONTHS_PT : MONTHS_EN;

  const createdAt = useMemo(() => {
    const d = new Date(habit.created_at);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [habit.created_at]);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor));
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [cursor]);

  return (
    <div className="border-t px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label={t("prev")}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label={t("next_btn")}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid max-w-xs grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[9px] text-muted-foreground">
            {w}
          </div>
        ))}
        {days.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const state = getDayState(logSet, habit.frequency, d, today, createdAt);
          const isToday = isSameDay(d, today);
          let bg = "transparent";
          let border = "transparent";
          if (state === "done") bg = color;
          else if (state === "missed") border = "var(--border)";
          return (
            <div
              key={toLocalIso(d)}
              className="flex aspect-square items-center justify-center rounded text-[9px]"
              style={{
                backgroundColor: bg,
                border: border === "transparent" ? undefined : `1px solid ${border}`,
                opacity: inMonth ? 1 : 0.25,
                color: state === "done" ? "#fff" : "var(--muted-foreground)",
                outline: isToday ? `1px solid ${color}` : undefined,
              }}
              title={toLocalIso(d)}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddHabitForm({ onClose }: { onClose: () => void }) {
  const { addHabit } = useHabits();
  const { t, locale } = useLocale();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);
  const [freqType, setFreqType] = useState<"daily" | "weekdays">("daily");
  const [days, setDays] = useState<Weekday[]>([1, 2, 3, 4, 5]); // seg–sex default
  const [saving, setSaving] = useState(false);

  const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const WEEKDAYS = locale === "pt" ? WEEKDAYS_PT : WEEKDAYS_EN;

  const toggleDay = (d: Weekday) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const submit = async () => {
    if (!name.trim() || saving) return;
    if (freqType === "weekdays" && days.length === 0) return;
    setSaving(true);
    const frequency: Frequency =
      freqType === "daily" ? { type: "daily" } : { type: "weekdays", days: [...days].sort() };
    await addHabit(name, color, frequency);
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{t("habit_add")}</p>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label={t("habit_cancel")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("habit_name_placeholder")}
        autoFocus
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
      />

      {/* Cor */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("habit_color_label")}</p>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              aria-label={c.name}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2"
              style={{
                backgroundColor: c.value,
                borderColor: color === c.value ? "var(--foreground)" : "transparent",
              }}
            >
              {color === c.value && <Check className="h-3.5 w-3.5 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Frequência */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("habit_freq_label")}</p>
        <div
          className="inline-flex overflow-hidden rounded-md border"
          style={{ borderWidth: "0.5px" }}
        >
          {(["daily", "weekdays"] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFreqType(ft)}
              className="whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: freqType === ft ? "var(--foreground)" : "transparent",
                color: freqType === ft ? "var(--background)" : "var(--muted-foreground)",
              }}
            >
              {ft === "daily" ? t("habit_freq_daily") : t("habit_freq_weekdays")}
            </button>
          ))}
        </div>

        {freqType === "weekdays" && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {WEEKDAYS.map((label, idx) => {
              const d = idx as Weekday;
              const on = days.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className="h-9 w-9 rounded-full border text-xs font-medium transition-colors"
                  style={{
                    borderWidth: "0.5px",
                    backgroundColor: on ? "var(--foreground)" : "transparent",
                    color: on ? "var(--background)" : "var(--muted-foreground)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onClose}
          className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          {t("habit_cancel")}
        </button>
        <button
          onClick={submit}
          disabled={!name.trim() || saving || (freqType === "weekdays" && days.length === 0)}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-40"
        >
          {t("habit_create")}
        </button>
      </div>
    </div>
  );
}
