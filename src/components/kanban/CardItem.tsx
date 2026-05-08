import { Calendar } from "lucide-react";
import { Card, PRIO_COLORS, TAG_COLORS, formatDate } from "@/lib/kanban-types";

export function CardItem({
  card,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  card: Card;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const prio = PRIO_COLORS[card.prio];
  return (
    <button
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className="kb-card group w-full cursor-grab text-left rounded-lg border bg-card p-3 transition-all hover:border-foreground/30 active:cursor-grabbing"
      style={{ borderWidth: "0.5px", opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug text-foreground line-clamp-2">{card.title}</h3>
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
        {card.tags.map((t) => {
          const c = TAG_COLORS[t];
          return (
            <span
              key={t}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: c.bg, color: c.fg }}
            >
              {t}
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
