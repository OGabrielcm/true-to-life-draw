import { useState } from "react";
import { Check, X, Plus, Trash2 } from "lucide-react";
import type { Card, ChecklistItem } from "@/lib/kanban-types";
import { getChecklistProgress } from "@/lib/kanban-types";
import { useLocale } from "@/lib/locale-context";

export function ChecklistSection({
  card,
  onUpdate,
}: {
  card: Card;
  onUpdate: (items: ChecklistItem[]) => void;
}) {
  const { t } = useLocale();
  const items = card.checklist ?? [];
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const progress = getChecklistProgress(card);

  const addItem = () => {
    const text = newText.trim();
    if (!text) return;
    const newItem: ChecklistItem = { id: crypto.randomUUID(), text, done: false };
    onUpdate([...items, newItem]);
    setNewText("");
  };

  const toggle = (id: string) => {
    onUpdate(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const remove = (id: string) => {
    onUpdate(items.filter((i) => i.id !== id));
  };

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = () => {
    if (!editingId || !editText.trim()) return;
    onUpdate(items.map((i) => (i.id === editingId ? { ...i, text: editText.trim() } : i)));
    setEditingId(null);
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t("checklist")} {items.length > 0 && `(${progress.done}/${progress.total})`}
        </p>
        {items.length > 0 && (
          <span className="text-xs font-semibold text-foreground">{progress.percent}%</span>
        )}
      </div>

      {items.length > 0 && (
        <div className="mb-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}

      <div className="space-y-0.5">
        {items.map((item) => (
          <div
            key={item.id}
            className={`group flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/40 ${
              item.done ? "opacity-60" : ""
            }`}
          >
            {/* Alvo de toque maior no checkbox (≥40px) sem inchar o desktop */}
            <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center -my-1 md:h-auto md:w-auto md:py-0">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggle(item.id)}
                className="h-4 w-4 cursor-pointer accent-foreground"
              />
            </label>
            {editingId === item.id ? (
              <>
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 md:h-7 md:w-7"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted md:h-7 md:w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span
                  onClick={() => startEdit(item)}
                  className={`flex-1 cursor-text text-sm leading-snug ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {item.text}
                </span>
                {/* Botão excluir: sempre visível em touch (sem hover no mobile),
                    revela no hover apenas no desktop. Alvo de toque ≥36px. */}
                <button
                  onClick={() => remove(item.id)}
                  aria-label="Excluir item"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 md:h-7 md:w-7 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder={t("checklist_add_placeholder")}
          className="flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
        />
        <button
          onClick={addItem}
          disabled={!newText.trim()}
          className="rounded-md bg-foreground p-1.5 text-background hover:opacity-90 disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
