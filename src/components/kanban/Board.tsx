import { useMemo, useState, useEffect, useRef } from "react";
import { Plus, Tags, ChevronDown, Layers, Archive, Columns, SlidersHorizontal } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
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
  const { t } = useLocale();
  const {
    cards,
    trilhas,
    tracks,
    columns,
    collapsed,
    search,
    filter,
    setFilter,
    trackFilter,
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
    getColumnsForTrack,
    saveTemplate,
    templates,
    cardColors,
    setCardColor,
  } = useKanban();

  const [adding, setAdding] = useState<{ col: ColumnId; track: TrackId } | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [trilhasOpen, setTrilhasOpen] = useState(false);
  const [tracksOpen, setTracksOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState<string | false>(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ track: TrackId; col: ColumnId } | null>(null);

  // Busca (2.3): casa o termo contra TÍTULO, DESCRIÇÃO e NOME das etiquetas do
  // card. Atenção: c.tags guarda IDs de trilha, não nomes — por isso resolvemos
  // id→nome via `trilhas` antes de comparar (um c.tags.includes(q) casaria IDs
  // e nunca acertaria o que o usuário digita). `filter` continua casando por ID.
  const trilhaNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of trilhas) m.set(t.id, t.name.toLowerCase());
    return m;
  }, [trilhas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (isArchived(c)) return false;
      if (filter !== "__all" && !c.tags.includes(filter)) return false;
      if (q) {
        const inTitle = c.title.toLowerCase().includes(q);
        const inDesc = (c.desc ?? "").toLowerCase().includes(q);
        const inTags = c.tags.some((id) => (trilhaNameById.get(id) ?? "").includes(q));
        if (!inTitle && !inDesc && !inTags) return false;
      }
      return true;
    });
  }, [cards, filter, search, trilhaNameById]);

  const archivedCount = useMemo(() => cards.filter(isArchived).length, [cards]);

  const goals = useMemo(() => cards.filter((c) => c.type === "Goal"), [cards]);
  const liveOpenCard = openCardId ? (cards.find((c) => c.id === openCardId) ?? null) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setFilterOpen(false); return; }
      // Não dispara o atalho "n" (novo card) quando o foco está num campo
      // editável — senão digitar "n" na busca/nome de trilha criaria um card.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "n" && !openCardId && !adding && !trilhasOpen && !tracksOpen && !columnsOpen && !filterOpen) {
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
  }, [openCardId, adding, trilhasOpen, tracksOpen, columnsOpen, filterOpen, tracks, columns]);

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  return (
    // kb-dragging: durante o arraste, desliga a box-shadow dos cards (existe só
    // no modo claro) para baratear o repaint ao rolar entre colunas — origem da
    // sensação "menos fluido no claro" relatada no 2.2. Hipótese a confirmar no
    // dispositivo; o dark não tem shadow base, então não muda nada lá.
    <div className={`flex flex-col${draggingId ? " kb-dragging" : ""}`}>
      {/* Filter bar */}
      <div className="sticky top-12 z-[5] border-b bg-background/80 px-3 py-2 backdrop-blur sm:px-6">
        <div className="flex items-center gap-1.5">
          {/* Chip "Todos" */}
          <button
            onClick={() => setFilter("__all")}
            className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: filter === "__all" ? "var(--foreground)" : "transparent",
              color: filter === "__all" ? "var(--background)" : "var(--muted-foreground)",
              border: `0.5px solid ${filter === "__all" ? "var(--foreground)" : "var(--border)"}`,
            }}
          >
            {t("all")}
          </button>

          {/* Chip da etiqueta ativa (quando alguma está selecionada) */}
          {filter !== "__all" && (() => {
            const active = trilhas.find((tr) => tr.id === filter);
            if (!active) return null;
            return (
              <span
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: active.bg, color: active.fg }}
              >
                {active.name}
                <button
                  onClick={() => setFilter("__all")}
                  className="ml-0.5 rounded-full hover:opacity-70 transition-opacity"
                  aria-label={t("cancel")}
                >
                  ×
                </button>
              </span>
            );
          })()}

          {/* Dropdown Etiquetas */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={{
                borderWidth: "0.5px",
                backgroundColor: filterOpen ? "var(--muted)" : "transparent",
                color: filterOpen ? "var(--foreground)" : "var(--muted-foreground)",
              }}
            >
              <Tags className="h-3.5 w-3.5" />
              {t("tags")}
              <ChevronDown
                className="h-3 w-3 transition-transform"
                style={{ transform: filterOpen ? "rotate(180deg)" : "rotate(0)" }}
              />
            </button>

            {filterOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-20 min-w-[200px] rounded-xl border bg-card p-1.5 shadow-lg"
                style={{ borderWidth: "0.5px" }}
              >
                {trilhas.length === 0 && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("no_tags_yet")}</p>
                )}
                {trilhas.map((tr) => {
                  const active = filter === tr.id;
                  return (
                    <button
                      key={tr.id}
                      onClick={() => { setFilter(active ? "__all" : tr.id); setFilterOpen(false); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tr.bg }}
                      />
                      <span className="flex-1 text-left text-foreground">{tr.name}</span>
                      {active && <span className="text-[10px] text-muted-foreground">✓</span>}
                    </button>
                  );
                })}
                <div className="mt-1 border-t pt-1" style={{ borderWidth: "0.5px" }}>
                  <button
                    onClick={() => { setTrilhasOpen(true); setFilterOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Tags className="h-3.5 w-3.5" />
                    {t("manage_tags")}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <main className="flex-1 overflow-x-auto">
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          {archivedCount > 0 && (
            <Link
              to="/dashboards"
              className="inline-flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span className="inline-flex items-center gap-2">
                <Archive className="h-3.5 w-3.5" />
                {archivedCount} {archivedCount === 1 ? t("archived_one") : t("archived_many")} ({t("done_since")} {ARCHIVE_AFTER_DAYS} {t("done_since_days")})
              </span>
              <span className="text-foreground/70">{t("see_dashboards")}</span>
            </Link>
          )}
          {tracks
            .filter((tr) => trackFilter === "__all" || tr.id === trackFilter)
            .map((track) => (
            <Swimlane
              key={track.id}
              track={track}
              columns={getColumnsForTrack(track.id)}
              cards={filtered.filter((c) => c.track === track.id)}
              allCards={cards}
              trilhas={trilhas}
              collapsed={collapsed[track.id]}
              onToggleCollapsed={() => toggleCollapsed(track.id)}
              onAdd={(col) => setAdding({ col, track: track.id })}
              onOpenCard={(c) => setOpenCardId(c.id)}
              onOpenColumns={() => setColumnsOpen(track.id)}
              draggingId={draggingId}
              dragOver={dragOver}
              setDraggingId={setDraggingId}
              setDragOver={setDragOver}
              moveCard={moveCard}
              reorderCard={reorderCard}
              cardColors={cardColors}
            />
          ))}
          {tracks.length <= 1 && (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold uppercase tracking-widest text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  {tracks.length === 0 ? t("no_tracks") : t("add_track_hint_title")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tracks.length === 0 ? t("no_tracks_desc") : t("add_track_hint_desc")}
                </p>
              </div>
              <button
                onClick={() => setTracksOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase" }}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("new_track")}
              </button>
            </div>
          )}
          {tracks.length >= 2 && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed px-4 py-3 opacity-60 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                <p className="text-xs">{t("add_track_hint_desc")}</p>
              </div>
              <button
                onClick={() => setTracksOpen(true)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-sm border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em", textTransform: "uppercase" }}
              >
                <Plus className="h-3 w-3" />
                {t("new_track")}
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
          columns={
            columnsOpen === "__global"
              ? columns.filter((c) => !c.track_id)
              : getColumnsForTrack(columnsOpen)
          }
          trackId={columnsOpen === "__global" ? undefined : columnsOpen}
          trackName={
            columnsOpen === "__global"
              ? undefined
              : tracks.find((tr) => tr.id === columnsOpen)?.name
          }
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
  onOpenColumns,
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
  onOpenColumns: () => void;
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
  const { t } = useLocale();
  const inProgress = cards.filter((c) => c.col === "inprogress").length;
  const bg = track.darkBg;
  const fg = track.darkFg;

  return (
    <section
      id={`track-${track.id}`}
      data-track={track.id}
      className="overflow-hidden rounded-xl border"
      style={{ borderLeft: `3px solid ${track.border}` }}
    >
      <button
        onClick={onToggleCollapsed}
        className="flex w-full items-center justify-between gap-3 rounded-t-xl px-4 py-3 text-left transition-opacity hover:opacity-90"
        style={{ backgroundColor: bg, color: fg }}
      >
        <div className="flex items-center gap-3">
          <h2
            className="text-lg font-semibold uppercase"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
          >
            {track.name}
          </h2>
          <span className="font-mono text-[11px] opacity-60">
            {cards.length} {cards.length === 1 ? t("card_label") : t("cards_label")}
            {inProgress > 0 && ` · ${inProgress} ${t("in_progress_label")}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenColumns(); }}
            className="rounded-md p-1.5 opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: fg }}
            aria-label={t("columns")}
            title={t("columns")}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <ChevronDown
            className="h-4 w-4 transition-transform"
            style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0)" }}
          />
        </div>
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
                className={`flex w-[220px] shrink-0 flex-col rounded-lg border transition-colors sm:w-[260px] md:w-auto md:flex-1 ${
                  col.wip_limit && colCards.length > col.wip_limit ? "border-destructive/50" : ""
                }`}
                style={{
                  minWidth: "180px",
                  backgroundColor: isOver
                    ? "color-mix(in oklab, var(--foreground) 8%, var(--muted))"
                    : undefined,
                }}
              >
                <div className="flex items-center justify-between px-3 pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-mono text-xs font-medium uppercase"
                      style={{ color: fg, letterSpacing: "0.08em" }}
                    >
                      {col.name}
                    </h3>
                    <span
                      className={`rounded-sm px-1.5 py-0.5 text-[10px] font-mono font-medium ${
                        col.wip_limit && colCards.length > col.wip_limit
                          ? "bg-orange-500/15 text-orange-500"
                          : "bg-muted text-muted-foreground"
                      }`}
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
                  className="m-2 inline-flex items-center justify-center gap-1 rounded-sm py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  {t("add")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
