import { supabase } from "./supabase";
import type { TimeLog } from "./kanban-types";

type SetTimeLogs = React.Dispatch<React.SetStateAction<Record<string, TimeLog[]>>>;

export async function fetchTimeLogs(cardId: string): Promise<TimeLog[]> {
  const { data } = await supabase
    .from("time_logs")
    .select("*")
    .eq("task_id", cardId)
    .order("logged_at", { ascending: false });
  return (data ?? []) as TimeLog[];
}

export async function addTimeLog(
  setTimeLogs: SetTimeLogs,
  userId: string,
  cardId: string,
  minutes: number,
  note?: string,
  loggedAt?: string,
): Promise<void> {
  if (minutes <= 0) return;
  const { data, error } = await supabase
    .from("time_logs")
    .insert({
      task_id: cardId,
      user_id: userId,
      minutes,
      note: note?.trim() || null,
      logged_at: loggedAt ?? new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (!error && data) {
    setTimeLogs((cur) => ({
      ...cur,
      [cardId]: [data as TimeLog, ...(cur[cardId] ?? [])],
    }));
  }
}

export async function deleteTimeLog(
  setTimeLogs: SetTimeLogs,
  logId: string,
  cardId: string,
): Promise<void> {
  setTimeLogs((cur) => ({
    ...cur,
    [cardId]: (cur[cardId] ?? []).filter((l) => l.id !== logId),
  }));
  await supabase.from("time_logs").delete().eq("id", logId);
}
