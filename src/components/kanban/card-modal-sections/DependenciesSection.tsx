import { useState } from "react";
import { X, Plus, Link2, AlertTriangle } from "lucide-react";
import type { Card } from "@/lib/kanban-types";
import { isBlocked } from "@/lib/kanban-types";
import { useLocale } from "@/lib/locale-context";

export function DependenciesSection({
  card,
  allCards,
  onUpdate,
}: {
  card: Card;
  allCards: Card[];
  onUpdate: (blockedBy: string[]) => void;
}) {
  const { t } = useLocale();
  const blockedBy = card.blocked_by ?? [];
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  const blockers = blockedBy
    .map((id) => allCards.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c));

  const blocked = isBlocked(card, allCards);

  const available = allCards
    .filter(
      (c) =>
        c.id !== card.id &&
        !blockedBy.includes(c.id) &&
        (search.trim() ? c.title.toLowerCase().includes(search.trim().toLowerCase()) : true),
    )
    .slice(0, 8);

  const addBlocker = (id: string) => {
    onUpdate([...blockedBy, id]);
    setSearch("");
    setAdding(false);
  };

  const removeBlocker = (id: string) => {
    onUpdate(blockedBy.filter((b) => b !== id));
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5">
          <Link2 className="h-3 w-3" />
          {t("blocked_by")} {blockers.length > 0 && `(${blockers.length})`}
        </p>
        {blocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-3 w-3" />
            {t("blocked_badge")}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {blockers.map((b) => {
          const resolved = b.col === "done";
          return (
            <div
              key={b.id}
              className="group flex items-center gap-2 rounded-md border bg-background px-2 py-1.5"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${resolved ? "bg-green-500" : "bg-red-500"}`}
                title={resolved ? t("completed") : t("pending")}
              />
              <span
                className={`flex-1 truncate text-sm ${resolved ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {b.title}
              </span>
              <button
                onClick={() => removeBlocker(b.id)}
                className="opacity-0 group-hover:opacity-100 rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          {t("add_dependency")}
        </button>
      ) : (
        <div className="mt-2 rounded-md border bg-background p-2">
          <div className="flex items-center gap-1.5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_card")}
              className="flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
              autoFocus
            />
            <button
              onClick={() => {
                setAdding(false);
                setSearch("");
              }}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto">
            {available.length === 0 ? (
              <p className="px-1 py-1 text-xs text-muted-foreground">{t("no_card_found")}</p>
            ) : (
              available.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addBlocker(c.id)}
                  className="block w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted"
                >
                  {c.title}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
