// Habit Tracker — tipos. Sistema separado do Kanban (não referencia Card).
//
// `frequency` é uma união discriminada. Na v1 só `daily` e `weekdays` (ambos
// têm dias fixos → streak e heatmap sem ambiguidade). `timesPerWeek` fica para
// depois (o jsonb no banco já comporta; é só adicionar a variante aqui).

// 0 = domingo … 6 = sábado (casa com o startOfWeek domingo-base do calendário).
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Frequency =
  | { type: "daily" }
  | { type: "weekdays"; days: Weekday[] };
// futuro: | { type: "timesPerWeek"; count: number };

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  frequency: Frequency;
  archived: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // ISO local yyyy-mm-dd
  created_at: string;
}

// Paleta de cores dos hábitos — reusa os swatches de cor de card já existentes
// (kanban-types CARD_COLOR_PRESETS), mantendo coerência visual com o app.
export const HABIT_COLORS: { name: string; value: string }[] = [
  { name: "blue", value: "#3b82f6" },
  { name: "green", value: "#22c55e" },
  { name: "purple", value: "#a855f7" },
  { name: "orange", value: "#f97316" },
  { name: "pink", value: "#ec4899" },
  { name: "red", value: "#ef4444" },
  { name: "yellow", value: "#eab308" },
];

export const DEFAULT_HABIT_COLOR = HABIT_COLORS[0].value;
