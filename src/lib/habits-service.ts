import { supabase } from "./supabase";
import type { Habit, HabitLog, Frequency } from "./habit-types";

type SetHabits = React.Dispatch<React.SetStateAction<Habit[]>>;
type SetLogs = React.Dispatch<React.SetStateAction<Record<string, HabitLog[]>>>;

export async function fetchHabits(): Promise<Habit[]> {
  const { data } = await supabase
    .from("habits")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: true });
  return (data ?? []) as Habit[];
}

export async function fetchLogs(habitId: string): Promise<HabitLog[]> {
  const { data } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("habit_id", habitId)
    .order("date", { ascending: false });
  return (data ?? []) as HabitLog[];
}

export async function addHabit(
  setHabits: SetHabits,
  userId: string,
  name: string,
  color: string,
  frequency: Frequency,
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const { data, error } = await supabase
    .from("habits")
    .insert({ user_id: userId, name: trimmed, color, frequency, archived: false })
    .select()
    .single();
  if (!error && data) {
    setHabits((cur) => [...cur, data as Habit]);
  }
}

export async function deleteHabit(
  setHabits: SetHabits,
  setLogs: SetLogs,
  habitId: string,
): Promise<void> {
  // Otimista: some da lista e limpa os logs locais; cascade no DB apaga as rows.
  setHabits((cur) => cur.filter((h) => h.id !== habitId));
  setLogs((cur) => {
    const next = { ...cur };
    delete next[habitId];
    return next;
  });
  await supabase.from("habits").delete().eq("id", habitId);
}

// Marca/desmarca o hábito num dia. A PRESENÇA da row = feito. Se já existe log
// naquele dia, remove (desmarcar); senão insere (marcar). Otimista.
// `currentLogs` = logs atuais do hábito (o store passa logsByHabit[habitId]).
export async function toggleLog(
  setLogs: SetLogs,
  currentLogs: HabitLog[],
  userId: string,
  habitId: string,
  date: string,
): Promise<void> {
  const existing = currentLogs.find((l) => l.date === date);

  if (existing) {
    // desmarcar
    setLogs((cur) => ({
      ...cur,
      [habitId]: (cur[habitId] ?? []).filter((l) => l.date !== date),
    }));
    await supabase.from("habit_logs").delete().eq("id", existing.id);
  } else {
    // marcar — insere e troca pelo row real
    const tempId = crypto.randomUUID();
    const optimistic: HabitLog = {
      id: tempId,
      habit_id: habitId,
      user_id: userId,
      date,
      created_at: new Date().toISOString(),
    };
    setLogs((cur) => ({
      ...cur,
      [habitId]: [optimistic, ...(cur[habitId] ?? [])],
    }));
    const { data, error } = await supabase
      .from("habit_logs")
      .insert({ habit_id: habitId, user_id: userId, date })
      .select()
      .single();
    if (error || !data) {
      // rollback
      setLogs((cur) => ({
        ...cur,
        [habitId]: (cur[habitId] ?? []).filter((l) => l.id !== tempId),
      }));
    } else {
      setLogs((cur) => ({
        ...cur,
        [habitId]: (cur[habitId] ?? []).map((l) => (l.id === tempId ? (data as HabitLog) : l)),
      }));
    }
  }
}
