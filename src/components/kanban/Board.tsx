import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Card,
  COLUMNS,
  ColumnId,
  Tag,
  TAGS,
  TAG_COLORS,
  loadCards,
  saveCards,
} from "@/lib/kanban-types";
import { CardItem } from "./CardItem";
import { AddCardModal } from "./AddCardModal";
import { CardDetailModal } from "./CardDetailModal";

type Filter = "Todos" | Tag;

export function Board() {
  const [cards, setCards] = useState<Card[]>([]);
  const [filter, setFilter] = useState<Filter>("Todos");
  const [addingTo, setAddingTo] = useState<ColumnId | null>(null);
  const [openCard, setOpenCard] = useState<Card | null>(null);

  useEffect(() => {
    setCards(loadCards());
  }, []);

  useEffect(() => {
    if (cards.length > 0 || localStorage.getItem("kanban-cards-v1")) {
      saveCards(cards);
    }
  }, [cards]);

  const filtered = useMemo(
    () => (filter === "Todos" ? cards : cards.filter((c) => c.tags.includes(filter))),
    [cards, filter],
  );

  const addCard = (data: Omit<Card, "id">) =>
    setCards((cur) => [...cur, { ...data, id: crypto.randomUUID() }]);
  const moveCard = (id: string, col: ColumnId) =>
    setCards((cur) => cur.map((c) => (c.id === id ? { ...c, col } : c)));
  const deleteCard = (id: string) => setCards((cur) => cur.filter((c) => c.id !== id));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur" style={{ borderWidth: "0.5px" }}>
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h1 className="text-base font-medium tracking-tight text-foreground">
            Personal Kanban
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            {(["Todos", ...TAGS] as Filter[]).map((f) => {
              const active = filter === f;
              const colors = f !== "Todos" ? TAG_COLORS[f] : null;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active
                      ? colors?.bg ?? "var(--foreground)"
                      : "transparent",
                    color: active
                      ? colors?.fg ?? "var(--background)"
                      : "var(--muted-foreground)",
                    border: `0.5px solid ${active ? (colors?.bg ?? "var(--foreground)") : "var(--border)"}`,
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-x-auto">
        <div className="flex min-h-full gap-3 p-4 sm:p-6" style={{ minWidth: "min-content" }}>
          {COLUMNS.map((col) => {
            const colCards = filtered.filter((c) => c.col === col.id);
            return (
              <section
                key={col.id}
                className="flex w-[280px] shrink-0 flex-col rounded-xl border bg-muted/40 sm:w-auto sm:flex-1"
                style={{ borderWidth: "0.5px", minWidth: "200px" }}
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
                    <CardItem key={c.id} card={c} onClick={() => setOpenCard(c)} />
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
          onClose={() => setAddingTo(null)}
          onAdd={addCard}
        />
      )}
      {openCard && (
        <CardDetailModal
          card={openCard}
          onClose={() => setOpenCard(null)}
          onMove={moveCard}
          onDelete={deleteCard}
        />
      )}
    </div>
  );
}
