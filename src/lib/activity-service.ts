import { supabase } from "./supabase";
import type { Activity, ActivityType } from "./kanban-types";

type SetActivities = React.Dispatch<React.SetStateAction<Record<string, Activity[]>>>;

export async function logActivity(
  setActivities: SetActivities,
  userId: string,
  taskId: string,
  type: ActivityType,
  message: string,
): Promise<void> {
  const tempId = crypto.randomUUID();
  const now = new Date().toISOString();
  const optimistic: Activity = { id: tempId, task_id: taskId, type, message, created_at: now };
  setActivities((cur) => ({
    ...cur,
    [taskId]: [optimistic, ...(cur[taskId] ?? [])],
  }));
  const { data, error } = await supabase
    .from("activities")
    .insert({ task_id: taskId, user_id: userId, type, message })
    .select()
    .single();
  if (error) {
    setActivities((cur) => ({
      ...cur,
      [taskId]: (cur[taskId] ?? []).filter((a) => a.id !== tempId),
    }));
  } else if (data) {
    setActivities((cur) => ({
      ...cur,
      [taskId]: (cur[taskId] ?? []).map((a) => (a.id === tempId ? (data as Activity) : a)),
    }));
  }
}

export async function fetchActivities(cardId: string): Promise<Activity[]> {
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("task_id", cardId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Activity[];
}
