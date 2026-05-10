import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Card,
  ColumnId,
  TrackId,
  Trilha,
  loadCards,
  saveCards,
  loadTrilhas,
  saveTrilhas,
  loadCollapsed,
  saveCollapsed,
} from "./kanban-types";

type AddInput = Omit<Card, "id" | "created_at" | "updated_at" | "starred"> & { starred?: boolean };

interface KanbanCtx {
  cards: Card[];
  trilhas: Trilha[];
  collapsed: Record<TrackId, boolean>;
  search: string;
  setSearch: (s: string) => void;
  filter: string;
  setFilter: (s: string) => void;
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

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [collapsed, setCollapsed] = useState<Record<TrackId, boolean>>({
    estagio: false,
    faculdade: false,
    "ia-dev": false,
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("__all");
  const [createOpen, setCreateOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCards(loadCards());
    setTrilhas(loadTrilhas());
    setCollapsed(loadCollapsed());
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) saveCards(cards); }, [cards, hydrated]);
  useEffect(() => { if (hydrated) saveTrilhas(trilhas); }, [trilhas, hydrated]);
  useEffect(() => { if (hydrated) saveCollapsed(collapsed); }, [collapsed, hydrated]);

  const value = useMemo<KanbanCtx>(() => ({
    cards, trilhas, collapsed, search, setSearch, filter, setFilter,
    createOpen, setCreateOpen,
    addCard: (data) => {
      const now = new Date().toISOString();
      setCards((cur) => [
        ...cur,
        { ...data, starred: data.starred ?? false, id: crypto.randomUUID(), created_at: now, updated_at: now },
      ]);
    },
    updateCard: (id, patch) => setCards((cur) =>
      cur.map((c) => c.id === id ? { ...c, ...patch, updated_at: new Date().toISOString() } : c)),
    moveCard: (id, col, track) => setCards((cur) =>
      cur.map((c) => c.id === id ? { ...c, col, track: track ?? c.track, updated_at: new Date().toISOString() } : c)),
    deleteCard: (id) => setCards((cur) => cur.filter((c) => c.id !== id)),
    toggleStar: (id) => setCards((cur) =>
      cur.map((c) => c.id === id ? { ...c, starred: !c.starred, updated_at: new Date().toISOString() } : c)),
    toggleCollapsed: (id) => setCollapsed((cur) => ({ ...cur, [id]: !cur[id] })),
    createTrilha: (t) => setTrilhas((cur) => [...cur, { ...t, id: crypto.randomUUID() }]),
    updateTrilha: (id, data) => setTrilhas((cur) => cur.map((t) => t.id === id ? { ...t, ...data } : t)),
    deleteTrilha: (id) => {
      setTrilhas((cur) => cur.filter((t) => t.id !== id));
      setCards((cur) => cur.map((c) => ({ ...c, tags: c.tags.filter((x) => x !== id) })));
      setFilter((f) => f === id ? "__all" : f);
    },
  }), [cards, trilhas, collapsed, search, filter, createOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKanban() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useKanban must be used inside KanbanProvider");
  return v;
}
