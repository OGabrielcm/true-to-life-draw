import { supabase } from "./supabase";
import type { Comment } from "./kanban-types";

type SetComments = React.Dispatch<React.SetStateAction<Record<string, Comment[]>>>;

export async function fetchComments(cardId: string): Promise<Comment[]> {
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("task_id", cardId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Comment[];
}

export async function addComment(
  setComments: SetComments,
  userId: string,
  cardId: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const { data, error } = await supabase
    .from("comments")
    .insert({ task_id: cardId, user_id: userId, text: trimmed })
    .select()
    .single();
  if (!error && data) {
    setComments((cur) => ({
      ...cur,
      [cardId]: [data as Comment, ...(cur[cardId] ?? [])],
    }));
  }
}

export async function updateComment(
  setComments: SetComments,
  commentId: string,
  text: string,
): Promise<void> {
  const now = new Date().toISOString();
  const trimmed = text.trim();
  setComments((cur) => {
    const next: Record<string, Comment[]> = {};
    for (const k of Object.keys(cur)) {
      next[k] = cur[k].map((c) =>
        c.id === commentId ? { ...c, text: trimmed, updated_at: now } : c,
      );
    }
    return next;
  });
  await supabase.from("comments").update({ text: trimmed, updated_at: now }).eq("id", commentId);
}

export async function deleteComment(
  setComments: SetComments,
  commentId: string,
  cardId: string,
): Promise<void> {
  setComments((cur) => ({
    ...cur,
    [cardId]: (cur[cardId] ?? []).filter((c) => c.id !== commentId),
  }));
  await supabase.from("comments").delete().eq("id", commentId);
}
