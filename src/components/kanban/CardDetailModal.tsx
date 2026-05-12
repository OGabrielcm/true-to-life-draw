import { useEffect, useState } from "react";
import { Calendar, Pencil, Star, Trash2, Target, Check, X } from "lucide-react";
import {
  Card,
  Column,
  ColumnId,
  PRIORITIES,
  PRIO_COLORS,
  Track,
  TrackId,
  Trilha,
  formatDate,
} from "@/lib/kanban-types";
import { useTheme } from "@/components/theme-provider";

export function CardDetailModal({
  card,
  allCards,
  tracks,
  columns,
  trilhas,
  onClose,
  onMove,
  onDelete,
  onToggleStar,
  onUpdate,
}: {
  card: Card;
  allCards: Card[];
  tracks: Track[];
  columns: Column[];
  trilhas: Trilha[];
  onClose: () => void;
  onMove: (id: string, col: ColumnId, track?: TrackId) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Card>) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const { theme } = useTheme();

  // Edit state
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.desc ?? "");
  const [editPrio, setEditPrio] = useState(card.prio);
  const [editDate, setEditDate] = useState(card.date ?? "");
  const [editTags, setEditTags] = useState<string[]>(card.tags);

  // Sync when card changes externally (e.g. optimistic update)
  useEffect(() => {
    if (!editing) {
      setEditTitle(card.title);
      setEditDesc(card.desc ?? "");
      setEditPrio(card.prio);
      setEditDate(card.date ?? "");
      setEditTags(card.tags);
    }
  }, [card, editing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) { setEditing(false); return; }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editing]);

  const saveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdate(card.id, {
      title: editTitle.trim(),
      desc: editDesc.trim() || undefined,
      prio: editPrio,
      date: editDate || undefined,
      tags: editTags,
    });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(card.title);
    setEditDesc(card.desc ?? "");
    setEditPrio(card.prio);
    setEditDate(card.date ?? "");
    setEditTags(card.tags);
    setEditing(false);
  };

  const toggleTag = (id: string) =>
    setEditTags((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);

  const prioRaw = PRIO_COLORS[editing ? editPrio : card.prio];
  const prio = theme === "dark"
    ? { bg: prioRaw.darkBg, fg: prioRaw.darkFg }
    : { bg: prioRaw.bg, fg: prioRaw.fg };
  const parent = card.parent_id ? allCards.find((c) => c.id === card.parent_id) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={editing ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-card p-5 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        {/* ── CABEÇALHO: badges + estrela + botão editar ── */}
        <div className="flex flex-wrap items-center gap-1.5">
          {!editing ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: prio.bg, color: prio.fg }}
            >
              {card.prio}
            </span>
          ) : (
            <select
              value={editPrio}
              onChange={(e) => setEditPrio(e.target.value as Card["prio"])}
              className="rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium outline-none"
              style={{ borderWidth: "0.5px", backgroundColor: prio.bg, color: prio.fg }}
            >
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground" style={{ borderWidth: "0.5px" }}>
            {card.type === "Goal" && <Target className="h-3 w-3" />}
            {card.type}
          </span>

          {/* Tags — view ou edit */}
          {!editing
            ? card.tags.map((tid) => {
                const t = trilhas.find((x) => x.id === tid);
                if (!t) return null;
                return (
                  <span key={tid} className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: t.bg, color: t.fg }}>
                    {t.name}
                  </span>
                );
              })
            : trilhas.map((t) => {
                const active = editTags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity"
                    style={{
                      backgroundColor: active ? t.bg : "transparent",
                      color: active ? t.fg : "var(--muted-foreground)",
                      border: `0.5px solid ${active ? t.bg : "var(--border)"}`,
                    }}
                  >
                    {t.name}
                  </button>
                );
              })
          }

          <div className="ml-auto flex items-center gap-1">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onToggleStar(card.id)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Favoritar"
            >
              <Star
                className={`h-4 w-4 ${card.starred ? "text-yellow-500" : ""}`}
                fill={card.starred ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>

        {/* ── TÍTULO ── */}
        {!editing ? (
          <h2 className="mt-3 text-lg font-medium text-card-foreground">{card.title}</h2>
        ) : (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-lg font-medium outline-none focus:border-foreground/40"
            style={{ borderWidth: "0.5px" }}
            autoFocus
          />
        )}

        {/* ── DATA ── */}
        {!editing ? (
          card.date && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(card.date)}
            </div>
          )
        ) : (
          <div className="mt-2 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-xs outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
            {editDate && (
              <button onClick={() => setEditDate("")} className="text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {parent && (
          <div className="mt-2 text-xs text-muted-foreground">
            Goal pai: <span className="text-foreground">{parent.title}</span>
          </div>
        )}

        {/* ── DESCRIÇÃO ── */}
        {!editing ? (
          card.desc && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-card-foreground/80">{card.desc}</p>
          )
        ) : (
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={4}
            placeholder="Descrição (opcional)"
            className="mt-3 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
            style={{ borderWidth: "0.5px" }}
          />
        )}

        {/* ── BOTÕES SALVAR / CANCELAR ── */}
        {editing && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={saveEdit}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" />
              Salvar
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ── MOVER (só em modo view) ── */}
        {!editing && (
          <>
            <div className="mt-5">
              <p className="text-xs font-medium text-muted-foreground">Mover para coluna</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {columns.filter((c) => c.id !== card.col).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { onMove(card.id, c.id); onClose(); }}
                    className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                    style={{ borderWidth: "0.5px" }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Mover para swimlane</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tracks.filter((t) => t.id !== card.track).map((t) => {
                  const bg = theme === "dark" ? t.darkBg : t.bg;
                  const fg = theme === "dark" ? t.darkFg : t.fg;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { onMove(card.id, card.col, t.id); onClose(); }}
                      className="rounded-md px-2.5 py-1 text-xs font-medium hover:opacity-80"
                      style={{ backgroundColor: bg, color: fg, border: `0.5px solid ${t.border}` }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── RODAPÉ: excluir + fechar ── */}
        {!editing && (
          <div className="mt-6 flex items-center justify-between">
            {!confirm ? (
              <button
                onClick={() => setConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Confirmar?</span>
                <button
                  onClick={() => { onDelete(card.id); onClose(); }}
                  className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
