import { useMemo, useState, useEffect } from "react";
import { Plus, Tags, ChevronDown, Layers, Archive, Columns } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  ARCHIVE_AFTER_DAYS,
  Card,
  Column,
  ColumnId,
  isArchived,
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
import { TracksModal } from "./TracksModal";
import { ColumnsModal } from "./ColumnsModal";

export function Board() {
  const {
    cards,
    trilhas,
    tracks,
    columns,
    collapsed,
    search,
    filter,
    setFilter,
    addCard,
    updateCard,
    moveCard,
    reorderCard,
    deleteCard,
    toggleStar,
    duplicateCard,
    toggleCollapsed,
    createTrilha,
    updateTrilha,
    deleteTrilha,
    createTrack,
    updateTrack,
    deleteTrack,
    createColumn,
    updateColumn,
    deleteColumn,
    saveTemplate,
    templates,
    cardColors,
    setCardColor,
  } = useKanban();

  const [adding, setAdding] = useState<{ col: ColumnId; track: TrackId } | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [trilhasOpen, setTrilhasOpen] = useState(false);
  const [tracksOpen, setTracksOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ track: TrackId; col: ColumnId } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (isArchived(c)) return false;
      if (filter !== "__all" && !c.tags.includes(filter)) return false;
      if (q && !c.title.toLowerCase().includes(q) && !(c.desc ?? "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [cards, filter, search]);

  const archivedCount = useMemo(() => cards.filter(isArchived).length, [cards]);

  const goals = useMemo(() => cards.filter((c) => c.type === "Goal"), [cards]);
  const liveOpenCard = openCardId ? (cards.find((c) => c.id === openCardId) ?? null) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "n" && !openCardId && !adding && !trilhasOpen && !tracksOpen && !columnsOpen) {
        e.preventDefault();
        const firstTrack = tracks[0];
        const firstCol = columns[0];
        if (firstTrack && firstCol) {
          setAdding({ track: firstTrack.id, col: firstCol.id });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCardId, adding, trilhasOpen, tracksOpen, columnsOpen, tracks, columns]);

  return (
    <div className="flex flex-col">
      {/* Filter chips */}
      <div
        className="sticky top-12 z-[5] border-b bg-background/80 px-3 py-2 backdrop-blur sm:px-6"
        style={{ borderWidth: "0.5px" }}
      >
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
            Tags
          </button>
          <button
            onClick={() => setTracksOpen(true)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            style={{ borderWidth: "0.5px" }}
          >
            <Layers className="h-3.5 w-3.5" />
            Tracks
          </button>
          <button
            onClick={() => setColumnsOpen(true)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            style={{ borderWidth: "0.5px" }}
          >
            <Columns className="h-3.5 w-3.5" />
            Colunas
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-x-auto">
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          {archivedCount > 0 && (
            <Link
              to="/dashboards"
              className="inline-flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              style={{ borderWidth: "0.5px" }}
            >
              <span className="inline-flex items-center gap-2">
                <Archive className="h-3.5 w-3.5" />
                {archivedCount} {archivedCount === 1 ? "card arquivado" : "cards arquivados"} (Done
                há mais de {ARCHIVE_AFTER_DAYS} dias)
              </span>
              <span className="text-foreground/70">Ver no Dashboards →</span>
            </Link>
          )}
          {tracks.map((track) => (
            <Swimlane
              key={track.id}
              track={track}
              columns={columns}
              cards={filtered.filter((c) => c.track === track.id)}
              allCards={cards}
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
              reorderCard={reorderCard}
              cardColors={cardColors}
            />
          ))}
          {tracks.length === 0 && (
            <div
              className="rounded-xl border border-dashed p-6 text-center"
              style={{ borderWidth: "0.5px" }}
            >
              <p className="text-sm text-muted-foreground">Nenhuma track ainda.</p>
              <button
                onClick={() => setTracksOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar primeira track
              </button>
            </div>
          )}
        </div>
      </main>

      {adding && (
        <AddCardModal
          column={adding.col}
          track={adding.track}
          tracks={tracks}
          columns={columns}
          trilhas={trilhas}
          goals={goals}
          templates={templates}
          onClose={() => setAdding(null)}
          onAdd={addCard}
        />
      )}
      {liveOpenCard && (
        <CardDetailModal
          card={liveOpenCard}
          allCards={cards}
          tracks={tracks}
          columns={columns}
          trilhas={trilhas}
          onClose={() => setOpenCardId(null)}
          onMove={moveCard}
          onDelete={deleteCard}
          onToggleStar={toggleStar}
          onUpdate={updateCard}
          onDuplicate={duplicateCard}
          onSaveTemplate={saveTemplate}
          onSetCardColor={setCardColor}
          cardColor={cardColors[liveOpenCard?.id ?? ""]}
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
      {tracksOpen && (
        <TracksModal
          tracks={tracks}
          onClose={() => setTracksOpen(false)}
          onCreate={createTrack}
          onUpdate={updateTrack}
          onDelete={deleteTrack}
        />
      )}
      {columnsOpen && (
        <ColumnsModal
          columns={columns}
          onClose={() => setColumnsOpen(false)}
          onCreate={createColumn}
          onUpdate={updateColumn}
          onDelete={deleteColumn}
        />
      )}
    </div>
  );
}

// Envolve um CardItem com drop zone que detecta posição (metade superior/inferior)
// e dispara reorderCard com beforeId/afterId correspondente. Mostra uma linha
// visual ANTES ou DEPOIS do card durante o drag.
function CardDropZone({
  card,
  allCards,
  trilhas,
  track,
  col,
  onClick,
  setDraggingId,
  setDragOver,
  draggingId,
  reorderCard,
  cardColor,
}: {
  card: Card;
  allCards: Card[];
  trilhas: Trilha[];
  track: TrackId;
  col: ColumnId;
  onClick: () => void;
  setDraggingId: (id: string | null) => void;
  setDragOver: (v: { track: TrackId; col: ColumnId } | null) => void;
  draggingId: string | null;
  reorderCard: (
    id: string,
    target: { col?: ColumnId; track?: TrackId; beforeId?: string; afterId?: string },
  ) => void;
  cardColor?: string;
}) {
  const [dropPos, setDropPos] = useState<"before" | "after" | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    // Detecta se o mouse está na metade superior ou inferior do card
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropPos(e.clientY < midY ? "before" : "after");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDropPos(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/plain");
    if (id && id !== card.id) {
      const target =
        dropPos === "before" ? { col, track, beforeId: card.id } : { col, track, afterId: card.id };
      reorderCard(id, target);
    }
    setDropPos(null);
    setDraggingId(null);
    setDragOver(null);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {dropPos === "before" && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 rounded-full bg-foreground" />
      )}
      <CardItem
        card={card}
        allCards={allCards}
        trilhas={trilhas}
        onClick={onClick}
        onDragStart={() => setDraggingId(card.id)}
        onDragEnd={() => {
          setDraggingId(null);
          setDragOver(null);
        }}
        isDragging={draggingId === card.id}
        onTouchDrop={(target) => {
          reorderCard(card.id, target);
          setDraggingId(null);
        }}
        cardColor={cardColor}
      />
      {dropPos === "after" && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-foreground" />
      )}
    </div>
  );
}

function Swimlane({
  track,
  columns,
  cards,
  allCards,
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
  reorderCard,
  cardColors,
}: {
  track: Track;
  columns: Column[];
  cards: Card[];
  allCards: Card[];
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
  reorderCard: (
    id: string,
    target: { col?: ColumnId; track?: TrackId; beforeId?: string; afterId?: string },
  ) => void;
  cardColors: Record<string, string>;
}) {
  const { theme } = useTheme();
  const inProgress = cards.filter((c) => c.col === "inprogress").length;
  const bg = theme === "dark" ? track.darkBg : track.bg;
  const fg = theme === "dark" ? track.darkFg : track.fg;

  return (
    <section
      id={`track-${track.id}`}
      data-track={track.id}
      className="overflow-hidden rounded-xl border"
      style={{ borderWidth: "0.5px", borderLeft: `4px solid ${track.border}` }}
    >
      <button
        onClick={onToggleCollapsed}
        className="flex w-full items-center justify-between gap-3 rounded-t-xl px-4 py-2.5 text-left transition-opacity hover:opacity-90"
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
        <div className="flex gap-3 overflow-x-auto p-3 pb-4">
          {columns.map((col) => {
            const colCards = cards
              .filter((c) => c.col === col.id)
              .sort((a, b) => a.order - b.order);
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
                  // Drop em área vazia da coluna (não em cima de um card) → vai pro fim
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moveCard(id, col.id, track.id);
                  setDragOver(null);
                  setDraggingId(null);
                }}
                className="flex w-[220px] shrink-0 flex-col rounded-lg border bg-muted/40 transition-colors sm:w-[260px] md:w-auto md:flex-1"
                style={{
                  borderWidth:
                    col.wip_limit && colCards.length > col.wip_limit
                      ? "2px solid #ef4444"
                      : "0.5px",
                  minWidth: "180px",
                  backgroundColor: isOver
                    ? "color-mix(in oklab, var(--foreground) 8%, var(--muted))"
                    : undefined,
                }}
              >
                <div className="flex items-center justify-between px-3 pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: fg }}
                    >
                      {col.name}
                    </h3>
                    <span
                      className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        color:
                          col.wip_limit && colCards.length > col.wip_limit
                            ? "#ef4444"
                            : "var(--muted-foreground)",
                        backgroundColor:
                          col.wip_limit && colCards.length > col.wip_limit ? "#fee2e2" : undefined,
                      }}
                    >
                      {colCards.length}
                      {col.wip_limit ? `/${col.wip_limit}` : ""}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                  {colCards.map((c) => (
                    <CardDropZone
                      key={c.id}
                      card={c}
                      allCards={allCards}
                      trilhas={trilhas}
                      track={track.id}
                      col={col.id}
                      onClick={() => onOpenCard(c)}
                      setDraggingId={setDraggingId}
                      setDragOver={setDragOver}
                      draggingId={draggingId}
                      reorderCard={reorderCard}
                      cardColor={cardColors[c.id]}
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
