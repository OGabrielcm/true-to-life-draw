import { useMemo } from "react";
import type { Habit, HabitLog } from "@/lib/habit-types";
import { aggregateLogCountsByDate } from "@/lib/habit-logic";
import { toLocalIso, addDays } from "@/lib/date-utils";

// Heatmap AGREGADO dos últimos 30 dias: uma linha de 30 células, intensidade =
// nº de hábitos feitos naquele dia (estilo GitHub). Compacto — sem navegação.
export function HabitHeatmapStrip({
  habits,
  logsByHabit,
  today,
}: {
  habits: Habit[];
  logsByHabit: Record<string, HabitLog[]>;
  today: Date;
}) {
  const counts = useMemo(
    () => aggregateLogCountsByDate(habits, logsByHabit),
    [habits, logsByHabit],
  );

  // 30 dias terminando hoje (índice 29 = hoje).
  const days = useMemo(
    () => Array.from({ length: 30 }, (_, i) => addDays(today, -29 + i)),
    [today],
  );

  const maxCount = habits.length || 1;

  return (
    <div className="flex gap-[3px]" role="img" aria-label="Últimos 30 dias">
      {days.map((d) => {
        const c = counts.get(toLocalIso(d)) ?? 0;
        // opacidade proporcional ao nº de hábitos feitos (0 = vazio).
        const opacity = c === 0 ? 0 : 0.25 + 0.75 * Math.min(c / maxCount, 1);
        return (
          <div
            key={toLocalIso(d)}
            className="h-6 flex-1 rounded-sm border"
            style={{
              borderWidth: "0.5px",
              backgroundColor: c === 0 ? "transparent" : `rgb(34 197 94 / ${opacity})`,
            }}
            title={`${toLocalIso(d)}: ${c} hábito(s)`}
          />
        );
      })}
    </div>
  );
}
