import { useMemo, useRef, useState } from "react";
import { Plus, Tags, ChevronDown } from "lucide-react";
import {
  Card,
  COLUMNS,
  ColumnId,
  TRACKS,
  Track,
  TrackId,
  Trilha,
} from "@/lib/kanban-types";
import { useKanban } from "@/lib/kanban-store";
import { useTheme } from "@/components/theme-provider";
import { CardItem } from "./CardItem";
import { AddCardModal } from "./AddCardModal";
import { CardDetailModal } from "./CardDetailModal";
import { TrilhasModal } from "./TrilhasModal";

export function Board() {
  const {
    cards, trilhas, collapsed, search, filter, setFilter,
    addCard, moveCard, deleteCard, toggleStar, toggleCollapsed,
    createTrilha, updateTrilha, deleteTrilha,
  } = useKanban();

  const [adding, setAdding] = useState<{ col: ColumnId; track: TrackId } | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [trilhasOpen, setTrilhasOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ track: TrackId; col: ColumnId } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (filter !== "__all" && !c.tags.includes(filter)) return false;
      if (q && !c.title.toLowerCase().includes(q) && !(c.desc ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cards, filter, search]);

  const goals = useMemo(() => cards.filter((c) => c.type === "Goal"), [cards]);
  const liveOpenCard = openCardId ? cards.find((c) => c.id === openCardId) ?? null : null;

  return (
    <div className="flex flex-col">
      {/* Filter chips */}
      <div className="sticky top-12 z-[5] border-b bg-background/80 px-3 py-2 backdrop-blur sm:px-6" style={{ borderWidth: "0.5px" }}>
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <button
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
              onOpenCard={(c) => setOpenCardId(c.id)}
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
          goals={goals}
          onClose={() => setAdding(null)}
          onAdd={addCard}
        />
      )}
      {liveOpenCard && (
        <CardDetailModal
          card={liveOpenCard}
          allCards={cards}
          trilhas={trilhas}
          onClose={() => setOpenCardId(null)}
          onMove={moveCard}
          onDelete={deleteCard}
          onToggleStar={toggleStar}
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
  const { theme } = useTheme();
  const inProgress = cards.filter((c) => c.col === "inprogress").length;
  const bg = theme === "dark" ? track.darkBg : track.bg;
  const fg = theme === "dark" ? track.darkFg : track.fg;

  // Touch drag state — lives on the scroll container, not on individual cards
  const touchRef = useRef<{
    cardId: string;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const cardEl = el?.closest("[data-card-id]");
    const cardId = cardEl?.getAttribute("data-card-id");
    if (!cardId) return;
    touchRef.current = { cardId, startX: t.clientX, startY: t.clientY, dragging: false };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchRef.current.startX);
    const dy = Math.abs(t.clientY - touchRef.current.startY);
    if (!touchRef.current.dragging) {
      // Horizontal dominante → scroll natural do browser, aborta drag
      if (dx > 10 && dx > dy * 1.5) {
        touchRef.current = null;
        return;
      }
      // Vertical dominante → inicia drag do card
      if (dy > 10 && dy > dx) {
        touchRef.current.dragging = true;
        setDraggingId(touchRef.current.cardId);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const state = touchRef.current;
    touchRef.current = null;
    if (!state?.dragging) return;

    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const colEl = target?.closest("[data-col]");
    if (colEl) {
      const col = colEl.getAttribute("data-col") as ColumnId;
      const trackEl = colEl.closest("[data-track]");
      const destTrack = (trackEl?.getAttribute("data-track") ?? track.id) as TrackId;
      moveCard(state.cardId, col, destTrack);
    }
    setDraggingId(null);
    setDragOver(null);
  };

  return (
    <section
      id={`track-${track.id}`}
      data-track={track.id}
      className="overflow-hidden rounded-xl border"
      style={{ borderWidth: "0.5px", borderLeft: `4px solid ${track.border}` }}
    >
      <button
        onClick={onToggleCollapsed}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-opacity hover:opacity-90"
        style={{ backgroundColor: bg, color: fg }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: track.border }} />
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
        <div
          className="flex gap-3 overflow-x-auto p-3 pb-4"
          style={{ minWidth: "min-content" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.col === col.id);
            const isOver = dragOver?.track === track.id && dragOver?.col === col.id;
            return (
              <div
                key={col.id}
                data-col={col.id}
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
                className="flex w-[220px] shrink-0 flex-col rounded-lg border bg-muted/40 transition-colors sm:w-[260px] md:w-auto md:flex-1"
                style={{
                  borderWidth: "0.5px",
                  minWidth: "180px",
                  backgroundColor: isOver
                    ? "color-mix(in oklab, var(--foreground) 8%, var(--muted))"
                    : undefined,
                }}
              >
                <div className="flex items-center justify-between px-3 pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-medium uppercase tracking-wide" style={{ color: fg }}>
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
                      onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
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
