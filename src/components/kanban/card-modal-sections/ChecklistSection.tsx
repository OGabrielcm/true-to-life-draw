import { useState } from "react";
import { Check, X, Plus, Trash2 } from "lucide-react";
import type { Card, ChecklistItem } from "@/lib/kanban-types";
import { getChecklistProgress } from "@/lib/kanban-types";

export function ChecklistSection({
  card,
  onUpdate,
}: {
  card: Card;
  onUpdate: (items: ChecklistItem[]) => void;
}) {
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
          Checklist {items.length > 0 && `(${progress.done}/${progress.total})`}
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

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/40"
          >
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggle(item.id)}
              className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-foreground"
            />
            {editingId === item.id ? (
              <>
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-md border bg-background px-2 py-0.5 text-sm outline-none focus:border-foreground/40"
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <span
                  onClick={() => startEdit(item)}
                  className={`flex-1 cursor-text text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => remove(item.id)}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3 w-3" />
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
          placeholder="Adicionar item..."
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
