import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../auth-store";
import type { Habit, HabitLog, Frequency } from "../habit-types";
import * as HabitsService from "../habits-service";
import { Ctx } from "./context";

export function HabitsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logsByHabit, setLogsByHabit] = useState<Record<string, HabitLog[]>>({});
  const [loading, setLoading] = useState(true);
  const inFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setHabits([]);
      setLogsByHabit({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const list = await HabitsService.fetchHabits();
      if (cancelled) return;
      setHabits(list);

      // Carrega os logs de todos os hábitos em paralelo (v1: volume pequeno).
      const entries = await Promise.all(
        list.map(async (h) => [h.id, await HabitsService.fetchLogs(h.id)] as const),
      );
      if (cancelled) return;
      const map: Record<string, HabitLog[]> = {};
      for (const [id, logs] of entries) map[id] = logs;
      setLogsByHabit(map);
      setLoading(false);
    };

    if (!inFlightRef.current) {
      inFlightRef.current = run().finally(() => {
        inFlightRef.current = null;
      });
    }

    return () => {
      cancelled = true;
    };
    // Chaveia por user?.id (primitivo estável), não pelo objeto user — mesma
    // lição do Bloco 2.1 (Supabase recria user a cada setSession).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  const addHabit = async (name: string, color: string, frequency: Frequency) => {
    if (!user) return;
    await HabitsService.addHabit(setHabits, user.id, name, color, frequency);
  };

  const deleteHabit = async (habitId: string) => {
    await HabitsService.deleteHabit(setHabits, setLogsByHabit, habitId);
  };

  const toggleLog = async (habitId: string, date: string) => {
    if (!user) return;
    await HabitsService.toggleLog(
      setLogsByHabit,
      logsByHabit[habitId] ?? [],
      user.id,
      habitId,
      date,
    );
  };

  const value = useMemo(
    () => ({ habits, logsByHabit, loading, addHabit, deleteHabit, toggleLog }),
    // addHabit/deleteHabit/toggleLog são closures estáveis o suficiente; o que
    // muda o value é o estado (habits/logsByHabit/loading).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habits, logsByHabit, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
