import { createContext, useContext } from "react";
import type { Habit, HabitLog, Frequency } from "../habit-types";

export interface HabitsCtx {
  habits: Habit[];
  logsByHabit: Record<string, HabitLog[]>;
  loading: boolean;
  addHabit: (name: string, color: string, frequency: Frequency) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleLog: (habitId: string, date: string) => Promise<void>;
}

export const Ctx = createContext<HabitsCtx | null>(null);

export function useHabits() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHabits must be used inside HabitsProvider");
  return v;
}
