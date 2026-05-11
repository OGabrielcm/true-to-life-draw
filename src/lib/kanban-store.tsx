import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Card,
  ColumnId,
  TrackId,
  Trilha,
  DEFAULT_TRILHAS,
  SEED_CARDS,
  loadCollapsed,
  saveCollapsed,
} from "./kanban-types";
import { supabase } from "./supabase";

type AddInput = Omit<Card, "id" | "created_at" | "updated_at" | "starred"> & { starred?: boolean };

interface KanbanCtx {
  cards: Card[];
  trilhas: Trilha[];
  collapsed: Record<TrackId, boolean>;
  search: string;
  setSearch: (s: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  loading: boolean;
  addCard: (data: AddInput) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
  moveCard: (id: string, col: ColumnId, track?: TrackId) => void;
  deleteCard: (id: string) => void;
  toggleStar: (id: string) => void;
  toggleCollapsed: (id: TrackId) => void;
  createTrilha: (t: Omit<Trilha, "id">) => void;
  updateTrilha: (id: string, data: Omit<Trilha, "id">) => void;
  deleteTrilha: (id: string) => void;
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
}

const Ctx = createContext<KanbanCtx | null>(null);

// Map Supabase row to Card (column names are the same, but ensure defaults)
function rowToCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as string,
    col: row.col as ColumnId,
    track: row.track as TrackId,
    type: (row.type as Card["type"]) ?? "Task",
    parent_id: row.parent_id as string | undefined,
    title: row.title as string,
    desc: row.desc as string | undefined,
    prio: row.prio as Card["prio"],
    date: row.date as string | undefined,
    starred: (row.starred as boolean) ?? false,
    tags: (row.tags as string[]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToTrilha(row: Record<string, unknown>): Trilha {
  return {
    id: row.id as string,
    name: row.name as string,
    bg: row.bg as string,
    fg: row.fg as string,
  };
}

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [collapsed, setCollapsed] = useState<Record<TrackId, boolean>>(loadCollapsed);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("__all");
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase on mount (after auth session is established)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [{ data: dbCards }, { data: dbTrilhas }] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at"),
        supabase.from("trilhas").select("*").order("created_at"),
      ]);

      if (cancelled) return;

      // Seed tasks if user has none
      if (!dbCards?.length) {
        const now = new Date().toISOString();
        const seeded = SEED_CARDS.map((c) => ({
          ...c,
          user_id: user.id,
          id: crypto.randomUUID(),
          created_at: now,
          updated_at: now,
        }));
        const { data: inserted } = await supabase.from("tasks").insert(seeded).select();
        if (!cancelled) setCards((inserted ?? []).map(rowToCard));
      } else {
        setCards(dbCards.map(rowToCard));
      }

      // Seed trilhas if user has none
      if (!dbTrilhas?.length) {
        const seededTrilhas = DEFAULT_TRILHAS.map((t) => ({ ...t, user_id: user.id }));
        const { data: inserted } = await supabase.from("trilhas").insert(seededTrilhas).select();
        if (!cancelled) setTrilhas((inserted ?? []).map(rowToTrilha));
      } else {
        setTrilhas(dbTrilhas.map(rowToTrilha));
      }

      if (!cancelled) setLoading(false);
    };

    // Re-run when auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") load();
      if (event === "SIGNED_OUT") {
        setCards([]);
        setTrilhas([]);
        setLoading(true);
      }
    });

    load();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    saveCollapsed(collapsed);
  }, [collapsed]);

  const value = useMemo<KanbanCtx>(() => ({
    cards,
    trilhas,
    collapsed,
    search,
    setSearch,
    filter,
    setFilter,
    loading,
    createOpen,
    setCreateOpen,

    addCard: async (data) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date().toISOString();
      const tempId = crypto.randomUUID();
      const newCard: Card = {
        ...data,
        starred: data.starred ?? false,
        id: tempId,
        created_at: now,
        updated_at: now,
      };
      // Optimistic
      setCards((cur) => [...cur, newCard]);
      // Persist
      const { data: inserted, error } = await supabase
        .from("tasks")
        .insert({ ...newCard, user_id: user.id })
        .select()
        .single();
      if (error) {
        setCards((cur) => cur.filter((c) => c.id !== tempId));
      } else if (inserted) {
        setCards((cur) => cur.map((c) => (c.id === tempId ? rowToCard(inserted) : c)));
      }
    },

    updateCard: async (id, patch) => {
      const now = new Date().toISOString();
      // Optimistic
      setCards((cur) =>
        cur.map((c) => (c.id === id ? { ...c, ...patch, updated_at: now } : c))
      );
      await supabase.from("tasks").update({ ...patch, updated_at: now }).eq("id", id);
    },

    moveCard: async (id, col, track) => {
      const now = new Date().toISOString();
      const patch: Partial<Card> = { col, updated_at: now };
      if (track) patch.track = track;
      // Optimistic
      setCards((cur) =>
        cur.map((c) =>
          c.id === id ? { ...c, col, track: track ?? c.track, updated_at: now } : c
        )
      );
      await supabase.from("tasks").update(patch).eq("id", id);
    },

    deleteCard: async (id) => {
      setCards((cur) => cur.filter((c) => c.id !== id));
      await supabase.from("tasks").delete().eq("id", id);
    },

    toggleStar: async (id) => {
      const now = new Date().toISOString();
      setCards((cur) =>
        cur.map((c) =>
          c.id === id ? { ...c, starred: !c.starred, updated_at: now } : c
        )
      );
      const card = cards.find((c) => c.id === id);
      if (card) {
        await supabase
          .from("tasks")
          .update({ starred: !card.starred, updated_at: now })
          .eq("id", id);
      }
    },

    toggleCollapsed: (id) =>
      setCollapsed((cur) => ({ ...cur, [id]: !cur[id] })),

    createTrilha: async (t) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const tempId = crypto.randomUUID();
      setTrilhas((cur) => [...cur, { ...t, id: tempId }]);
      const { data: inserted, error } = await supabase
        .from("trilhas")
        .insert({ ...t, user_id: user.id })
        .select()
        .single();
      if (error) {
        setTrilhas((cur) => cur.filter((x) => x.id !== tempId));
      } else if (inserted) {
        setTrilhas((cur) =>
          cur.map((x) => (x.id === tempId ? rowToTrilha(inserted) : x))
        );
      }
    },

    updateTrilha: async (id, data) => {
      setTrilhas((cur) => cur.map((t) => (t.id === id ? { ...t, ...data } : t)));
      await supabase.from("trilhas").update(data).eq("id", id);
    },

    deleteTrilha: async (id) => {
      setTrilhas((cur) => cur.filter((t) => t.id !== id));
      setCards((cur) =>
        cur.map((c) => ({ ...c, tags: c.tags.filter((x) => x !== id) }))
      );
      setFilter((f) => (f === id ? "__all" : f));
      await supabase.from("trilhas").delete().eq("id", id);
      // Remove tag from all cards in DB
      await supabase.rpc("remove_tag_from_tasks", { tag_id: id });
    },
  }), [cards, trilhas, collapsed, search, filter, createOpen, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKanban() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useKanban must be used inside KanbanProvider");
  return v;
}
