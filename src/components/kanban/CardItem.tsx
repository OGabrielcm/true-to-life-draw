import { useRef } from "react";
import { Calendar, Star, Target } from "lucide-react";
import { Card, ColumnId, PRIO_COLORS, TrackId, Trilha, formatDate } from "@/lib/kanban-types";
import { useTheme } from "@/components/theme-provider";

export function CardItem({
  card,
  trilhas,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
  onTouchDrop,
}: {
  card: Card;
  trilhas: Trilha[];
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onTouchDrop?: (col: ColumnId, track: TrackId) => void;
}) {
  const { theme } = useTheme();
  const prioRaw = PRIO_COLORS[card.prio];
  const prio = theme === "dark"
    ? { bg: prioRaw.darkBg, fg: prioRaw.darkFg }
    : { bg: prioRaw.bg, fg: prioRaw.fg };
  const isGoal = card.type === "Goal";

  const touchRef = useRef<{ startX: number; startY: number; dragging: boolean } | null>(null);
  const justDraggedRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, dragging: false };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchRef.current.startX);
    const dy = Math.abs(t.clientY - touchRef.current.startY);
    if (!touchRef.current.dragging && (dx > 6 || dy > 6)) {
      touchRef.current.dragging = true;
      onDragStart();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const state = touchRef.current;
    touchRef.current = null;
    if (!state?.dragging) return;

    justDraggedRef.current = true;
    const touch = e.changedTouches[0];
    const el = e.currentTarget as HTMLElement;
    el.style.visibility = "hidden";
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    el.style.visibility = "";

    const colEl = target?.closest("[data-col]");
    if (colEl && onTouchDrop) {
      const col = colEl.getAttribute("data-col") as ColumnId;
      const trackEl = colEl.closest("[data-track]");
      const track = trackEl?.getAttribute("data-track") as TrackId;
      if (col && track) onTouchDrop(col, track);
    }
    onDragEnd();
  };

  const handleClick = () => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="kb-card group w-full cursor-grab text-left rounded-lg border bg-card p-3 transition-all hover:border-foreground/30 active:cursor-grabbing"
      style={{
        borderWidth: "0.5px",
        opacity: isDragging ? 0.4 : 1,
        borderLeft: isGoal ? "3px solid var(--foreground)" : undefined,
        touchAction: "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1">
          {isGoal && <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />}
          <h3 className="text-sm font-medium leading-snug text-card-foreground line-clamp-2">{card.title}</h3>
        </div>
        {card.starred && (
          <Star className="h-3.5 w-3.5 shrink-0 text-yellow-500" fill="currentColor" />
        )}
      </div>
      {card.desc && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{card.desc}</p>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: prio.bg, color: prio.fg }}
        >
          {card.prio}
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
        {card.date && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(card.date)}
          </span>
        )}
      </div>
    </button>
  );
}
