import { useEffect, useMemo, useState } from "react";
import { Plus, Tags, ChevronDown } from "lucide-react";
import {
  Card,
  COLUMNS,
  ColumnId,
  TRACKS,
  Track,
  TrackId,
  Trilha,
  loadCards,
  saveCards,
  loadTrilhas,
  saveTrilhas,
  loadCollapsed,
  saveCollapsed,
} from "@/lib/kanban-types";
import { CardItem } from "./CardItem";
import { AddCardModal } from "./AddCardModal";
import { CardDetailModal } from "./CardDetailModal";
import { TrilhasModal } from "./TrilhasModal";

export function Board() {
  const [cards, setCards] = useState<Card[]>([]);
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [filter, setFilter] = useState<string>("__all"); // "__all" or trilha id
  const [adding, setAdding] = useState<{ col: ColumnId; track: TrackId } | null>(null);
  const [openCard, setOpenCard] = useState<Card | null>(null);
  const [trilhasOpen, setTrilhasOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ track: TrackId; col: ColumnId } | null>(null);
  const [collapsed, setCollapsed] = useState<Record<TrackId, boolean>>({
    estagio: false,
    faculdade: false,
    "ia-dev": false,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCards(loadCards());
    setTrilhas(loadTrilhas());
    setCollapsed(loadCollapsed());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCards(cards);
  }, [cards, hydrated]);

  useEffect(() => {
    if (hydrated) saveTrilhas(trilhas);
  }, [trilhas, hydrated]);

  useEffect(() => {
    if (hydrated) saveCollapsed(collapsed);
  }, [collapsed, hydrated]);

  const filtered = useMemo(
    () =>
      filter === "__all"
        ? cards
        : cards.filter((c) => c.tags.includes(filter)),
    [cards, filter],
  );

  const addCard = (data: Omit<Card, "id">) =>
    setCards((cur) => [...cur, { ...data, id: crypto.randomUUID() }]);
  const moveCard = (id: string, col: ColumnId, track?: TrackId) =>
    setCards((cur) =>
      cur.map((c) => (c.id === id ? { ...c, col, track: track ?? c.track } : c)),
    );
  const deleteCard = (id: string) => setCards((cur) => cur.filter((c) => c.id !== id));

  const createTrilha = (t: Omit<Trilha, "id">) =>
    setTrilhas((cur) => [...cur, { ...t, id: crypto.randomUUID() }]);
  const updateTrilha = (id: string, data: Omit<Trilha, "id">) =>
    setTrilhas((cur) => cur.map((t) => (t.id === id ? { ...t, ...data } : t)));
  const deleteTrilha = (id: string) => {
    setTrilhas((cur) => cur.filter((t) => t.id !== id));
    setCards((cur) => cur.map((c) => ({ ...c, tags: c.tags.filter((x) => x !== id) })));
    setFilter((f) => (f === id ? "__all" : f));
  };

  const toggleCollapsed = (id: TrackId) =>
    setCollapsed((cur) => ({ ...cur, [id]: !cur[id] }));

  // Sync openCard with cards (in case it was edited/deleted)
  const liveOpenCard = openCard ? cards.find((c) => c.id === openCard.id) ?? null : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur"
        style={{ borderWidth: "0.5px" }}
      >
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h1 className="text-base font-medium tracking-tight text-foreground">
            Gerenciador de Molas
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <button
              key="__all"
              onClick={() => setFilter("__all")}
              className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: filter === "__all" ? "var(--foreground)" : "transparent",
                color: filter === "__all" ? "var(--background)" : "var(--muted-foreground)",
                border: `0.5px solid ${filter === "__all" ? "var(--foreground)" : "var(--border)"}`,
              }}
            >
              Todos
            </button>
            {trilhas.map((t) => {
              const active = filter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active ? t.bg : "transparent",
                    color: active ? t.fg : "var(--muted-foreground)",
                    border: `0.5px solid ${active ? t.bg : "var(--border)"}`,
                  }}
                >
                  {t.name}
                </button>
              );
            })}
            <button
              onClick={() => setTrilhasOpen(true)}
              className="ml-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              style={{ borderWidth: "0.5px" }}
            >
              <Tags className="h-3.5 w-3.5" />
              Trilhas
            </button>
          </div>
        </div>
      </header>

      {/* Swimlanes */}
      <main className="flex-1 overflow-x-auto">
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          {TRACKS.map((track) => (
            <Swimlane
              key={track.id}
              track={track}
              cards={filtered.filter((c) => c.track === track.id)}
              trilhas={trilhas}
              collapsed={collapsed[track.id]}
              onToggleCollapsed={() => toggleCollapsed(track.id)}
              onAdd={(col) => setAdding({ col, track: track.id })}
              onOpenCard={setOpenCard}
              draggingId={draggingId}
              dragOver={dragOver}
              setDraggingId={setDraggingId}
              setDragOver={setDragOver}
              moveCard={moveCard}
            />
          ))}
        </div>
      </main>

      {adding && (
        <AddCardModal
          column={adding.col}
          track={adding.track}
          trilhas={trilhas}
          onClose={() => setAdding(null)}
          onAdd={addCard}
        />
      )}
      {liveOpenCard && (
        <CardDetailModal
          card={liveOpenCard}
          trilhas={trilhas}
          onClose={() => setOpenCard(null)}
          onMove={moveCard}
          onDelete={deleteCard}
        />
      )}
      {trilhasOpen && (
        <TrilhasModal
          trilhas={trilhas}
          onClose={() => setTrilhasOpen(false)}
          onCreate={createTrilha}
          onUpdate={updateTrilha}
          onDelete={deleteTrilha}
        />
      )}
    </div>
  );
}

function Swimlane({
  track,
  cards,
  trilhas,
  collapsed,
  onToggleCollapsed,
  onAdd,
  onOpenCard,
  draggingId,
  dragOver,
  setDraggingId,
  setDragOver,
  moveCard,
}: {
  track: Track;
  cards: Card[];
  trilhas: Trilha[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onAdd: (col: ColumnId) => void;
  onOpenCard: (c: Card) => void;
  draggingId: string | null;
  dragOver: { track: TrackId; col: ColumnId } | null;
  setDraggingId: (id: string | null) => void;
  setDragOver: (v: { track: TrackId; col: ColumnId } | null) => void;
  moveCard: (id: string, col: ColumnId, track?: TrackId) => void;
}) {
  const inProgress = cards.filter((c) => c.col === "inprogress").length;

  return (
    <section
      className="overflow-hidden rounded-xl border"
      style={{ borderWidth: "0.5px", borderLeft: `3px solid ${track.border}` }}
    >
      {/* Swimlane header */}
      <button
        onClick={onToggleCollapsed}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-opacity hover:opacity-90"
        style={{ backgroundColor: track.bg, color: track.fg }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: track.border }}
          />
          <h2 className="text-sm font-medium">{track.name}</h2>
          <span className="text-xs opacity-70">
            {cards.length} {cards.length === 1 ? "card" : "cards"}
            {inProgress > 0 && ` · ${inProgress} em andamento`}
          </span>
        </div>
        <ChevronDown
          className="h-4 w-4 transition-transform"
          style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0)" }}
        />
      </button>

      {!collapsed && (
        <div className="flex gap-3 overflow-x-auto p-3" style={{ minWidth: "min-content" }}>
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.col === col.id);
            const isOver =
              dragOver?.track === track.id && dragOver?.col === col.id;
            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (!isOver) setDragOver({ track: track.id, col: col.id });
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (isOver) setDragOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moveCard(id, col.id, track.id);
                  setDragOver(null);
                  setDraggingId(null);
                }}
                className="flex w-[260px] shrink-0 flex-col rounded-lg border bg-muted/40 transition-colors sm:w-auto sm:flex-1"
                style={{
                  borderWidth: "0.5px",
                  minWidth: "200px",
                  backgroundColor: isOver
                    ? "color-mix(in oklab, var(--foreground) 8%, var(--muted))"
                    : undefined,
                }}
              >
                <div className="flex items-center justify-between px-3 pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: track.fg }}
                    >
                      {col.name}
                    </h3>
                    <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {colCards.length}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                  {colCards.map((c) => (
                    <CardItem
                      key={c.id}
                      card={c}
                      trilhas={trilhas}
                      onClick={() => onOpenCard(c)}
                      onDragStart={() => setDraggingId(c.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOver(null);
                      }}
                      isDragging={draggingId === c.id}
                    />
                  ))}
                </div>
                <button
                  onClick={() => onAdd(col.id)}
                  className="m-2 inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
