import { useEffect, useState } from "react";
import { Calendar, Star, Trash2, Target } from "lucide-react";
import { Card, COLUMNS, ColumnId, PRIO_COLORS, TRACKS, TrackId, Trilha, formatDate } from "@/lib/kanban-types";
import { useTheme } from "@/components/theme-provider";

export function CardDetailModal({
  card,
  allCards,
  trilhas,
  onClose,
  onMove,
  onDelete,
  onToggleStar,
}: {
  card: Card;
  allCards: Card[];
  trilhas: Trilha[];
  onClose: () => void;
  onMove: (id: string, col: ColumnId, track?: TrackId) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const prioRaw = PRIO_COLORS[card.prio];
  const prio = theme === "dark"
    ? { bg: prioRaw.darkBg, fg: prioRaw.darkFg }
    : { bg: prioRaw.bg, fg: prioRaw.fg };
  const parent = card.parent_id ? allCards.find((c) => c.id === card.parent_id) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-card p-5 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: prio.bg, color: prio.fg }}
          >
            {card.prio}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground" style={{ borderWidth: "0.5px" }}>
            {card.type === "Goal" && <Target className="h-3 w-3" />}
            {card.type}
          </span>
          {card.tags.map((tid) => {
            const t = trilhas.find((x) => x.id === tid);
            if (!t) return null;
            return (
              <span
                key={tid}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: t.bg, color: t.fg }}
              >
                {t.name}
              </span>
            );
          })}
          <button
            onClick={() => onToggleStar(card.id)}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Favoritar"
          >
            <Star
              className={`h-4 w-4 ${card.starred ? "text-yellow-500" : ""}`}
              fill={card.starred ? "currentColor" : "none"}
            />
          </button>
        </div>
        <h2 className="mt-3 text-lg font-medium text-card-foreground">{card.title}</h2>
        {card.date && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(card.date)}
          </div>
        )}
        {parent && (
          <div className="mt-2 text-xs text-muted-foreground">
            Goal pai: <span className="text-foreground">{parent.title}</span>
          </div>
        )}
        {card.desc && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-card-foreground/80">{card.desc}</p>
        )}

        <div className="mt-5">
          <p className="text-xs font-medium text-muted-foreground">Mover para coluna</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COLUMNS.filter((c) => c.id !== card.col).map((c) => (
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
            {TRACKS.filter((t) => t.id !== card.track).map((t) => {
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
      </div>
    </div>
  );
}
