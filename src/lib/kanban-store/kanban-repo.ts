// Camada de acesso ao Supabase do kanban-store. ÚNICO lugar que conhece os
// nomes das tabelas e o shape das queries — o provider só orquestra estado +
// chama estes métodos. Centralizar aqui permite, no futuro, adicionar retry,
// tratamento de erro uniforme ou trocar de backend sem caçar `supabase.from`
// espalhado por 15 ações.
//
// Convenção: cada método devolve o `{ data, error }` cru do Supabase para que
// o provider decida sobre rollback otimista. Métodos sem leitura de volta
// devolvem só `{ error }`.
import { supabase } from "../supabase";
import { Card, Trilha } from "../kanban-types";
import { trackToRow } from "./kanban-mappers";

type Row = Record<string, unknown>;

async function getUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export const kanbanRepo = {
  // Carga inicial: as quatro entidades em paralelo, na ordem usada pelo board.
  async loadAll() {
    const [cards, trilhas, tracks, columns] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at"),
      supabase.from("trilhas").select("*").order("created_at"),
      supabase.from("tracks").select("*").order("order"),
      supabase.from("columns").select("*").order("order"),
    ]);
    return {
      cards: cards.data ?? [],
      trilhas: trilhas.data ?? [],
      tracks: tracks.data ?? [],
      columns: columns.data ?? [],
    };
  },

  getUserId,

  tasks: {
    insert: (card: Card, userId: string) =>
      supabase
        .from("tasks")
        .insert({ ...card, user_id: userId })
        .select()
        .single(),
    update: (id: string, patch: Row) => supabase.from("tasks").update(patch).eq("id", id),
    remove: (id: string) => supabase.from("tasks").delete().eq("id", id),
    // Cascata: reatribui ou apaga cards de uma track/coluna deletada.
    reassignTrack: (fromTrack: string, toTrack: string, now: string) =>
      supabase.from("tasks").update({ track: toTrack, updated_at: now }).eq("track", fromTrack),
    deleteByTrack: (track: string) => supabase.from("tasks").delete().eq("track", track),
    reassignColumn: (fromCol: string, toCol: string, now: string) =>
      supabase.from("tasks").update({ col: toCol, updated_at: now }).eq("col", fromCol),
    deleteByColumn: (col: string) => supabase.from("tasks").delete().eq("col", col),
  },

  trilhas: {
    insert: (t: Omit<Trilha, "id">, userId: string) =>
      supabase
        .from("trilhas")
        .insert({ ...t, user_id: userId })
        .select()
        .single(),
    update: (id: string, data: Row) => supabase.from("trilhas").update(data).eq("id", id),
    remove: (id: string) => supabase.from("trilhas").delete().eq("id", id),
    // Remove a tag (trilha) de todos os cards no banco após deletá-la.
    removeTagFromTasks: (tagId: string) => supabase.rpc("remove_tag_from_tasks", { tag_id: tagId }),
  },

  tracks: {
    insert: (row: Row, userId: string) =>
      supabase
        .from("tracks")
        .insert({ ...row, user_id: userId })
        .select()
        .single(),
    update: (id: string, data: Parameters<typeof trackToRow>[0]) =>
      supabase.from("tracks").update(trackToRow(data)).eq("id", id),
    remove: (id: string) => supabase.from("tracks").delete().eq("id", id),
  },

  columns: {
    insert: (row: Row) => supabase.from("columns").insert(row).select().single(),
    update: (id: string, patch: Row) => supabase.from("columns").update(patch).eq("id", id),
    remove: (id: string) => supabase.from("columns").delete().eq("id", id),
  },
};
