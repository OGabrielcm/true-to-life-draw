import { useEffect, useMemo, useState } from "react";
import { Plus, Tags } from "lucide-react";
import {
  Card,
  COLUMNS,
  ColumnId,
  Trilha,
  loadCards,
  saveCards,
  loadTrilhas,
  saveTrilhas,
} from "@/lib/kanban-types";
import { CardItem } from "./CardItem";
import { AddCardModal } from "./AddCardModal";
import { CardDetailModal } from "./CardDetailModal";
import { TrilhasModal } from "./TrilhasModal";

export function Board() {
  const [cards, setCards] = useState<Card[]>([]);
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [filter, setFilter] = useState<string>("__all"); // "__all" or trilha id
  const [addingTo, setAddingTo] = useState<ColumnId | null>(null);
  const [openCard, setOpenCard] = useState<Card | null>(null);
  const [trilhasOpen, setTrilhasOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCards(loadCards());
    setTrilhas(loadTrilhas());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCards(cards);
  }, [cards, hydrated]);

  useEffect(() => {
    if (hydrated) saveTrilhas(trilhas);
  }, [trilhas, hydrated]);

  const filtered = useMemo(
    () =>
      filter === "__all"
        ? cards
        : cards.filter((c) => c.tags.includes(filter)),
    [cards, filter],
  );

  const addCard = (data: Omit<Card, "id">) =>
    setCards((cur) => [...cur, { ...data, id: crypto.randomUUID() }]);
  const moveCard = (id: string, col: ColumnId) =>
    setCards((cur) => cur.map((c) => (c.id === id ? { ...c, col } : c)));
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

  // Sync openCard with cards (in case it was edited/deleted)
  const liveOpenCard = openCard ? cards.find((c) => c.id === openCard.id) ?? null : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur" style={{ borderWidth: "0.5px" }}>
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

      {/* Board */}
      <main className="flex-1 overflow-x-auto">
        <div className="flex min-h-full gap-3 p-4 sm:p-6" style={{ minWidth: "min-content" }}>
          {COLUMNS.map((col) => {
            const colCards = filtered.filter((c) => c.col === col.id);
            const isOver = dragOverCol === col.id;
            return (
              <section
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverCol !== col.id) setDragOverCol(col.id);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDragOverCol((cur) => (cur === col.id ? null : cur));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moveCard(id, col.id);
                  setDragOverCol(null);
                  setDraggingId(null);
                }}
                className="flex w-[280px] shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors sm:w-auto sm:flex-1"
                style={{
                  borderWidth: "0.5px",
                  minWidth: "200px",
                  backgroundColor: isOver ? "color-mix(in oklab, var(--foreground) 8%, var(--muted))" : undefined,
                }}
              >
                <div className="flex items-center justify-between px-3 pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-medium uppercase tracking-wide text-foreground">
                      {col.name}
                    </h2>
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
                      onClick={() => setOpenCard(c)}
                      onDragStart={() => setDraggingId(c.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverCol(null);
                      }}
                      isDragging={draggingId === c.id}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setAddingTo(col.id)}
                  className="m-2 inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </button>
              </section>
            );
          })}
        </div>
      </main>

      {addingTo && (
        <AddCardModal
          column={addingTo}
          trilhas={trilhas}
          onClose={() => setAddingTo(null)}
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
