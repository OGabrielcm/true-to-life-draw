import { useEffect, useState } from "react";
import { ColumnId, Priority, PRIORITIES, Trilha, Card } from "@/lib/kanban-types";

export function AddCardModal({
  column,
  trilhas,
  onClose,
  onAdd,
}: {
  column: ColumnId;
  trilhas: Trilha[];
  onClose: () => void;
  onAdd: (card: Omit<Card, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [prio, setPrio] = useState<Priority>("Média");
  const [date, setDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      col: column,
      title: title.trim(),
      desc: desc.trim() || undefined,
      prio,
      date: date || undefined,
      tags,
    });
    onClose();
  };

  const toggleTag = (id: string) =>
    setTags((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-xl bg-card p-5 shadow-xl"
      >
        <h2 className="text-base font-medium text-foreground">Adicionar card</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
              <select
                value={prio}
                onChange={(e) => setPrio(e.target.value as Priority)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                style={{ borderWidth: "0.5px" }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Deadline</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                style={{ borderWidth: "0.5px" }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Trilhas</label>
            {trilhas.length === 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Nenhuma trilha cadastrada. Crie uma no botão "Trilhas" no topo.
              </p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {trilhas.map((t) => {
                  const active = tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className="rounded-full px-2.5 py-1 text-xs font-medium transition-opacity"
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
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Adicionar
          </button>
        </div>
      </form>
    </div>
  );
}
