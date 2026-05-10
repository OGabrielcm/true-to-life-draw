import { Calendar, Star, Target } from "lucide-react";
import { Card, PRIO_COLORS, Trilha, formatDate } from "@/lib/kanban-types";
import { useTheme } from "@/components/theme-provider";

export function CardItem({
  card,
  trilhas,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  card: Card;
  trilhas: Trilha[];
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const { theme } = useTheme();
  const prioRaw = PRIO_COLORS[card.prio];
  const prio = theme === "dark"
    ? { bg: prioRaw.darkBg, fg: prioRaw.darkFg }
    : { bg: prioRaw.bg, fg: prioRaw.fg };
  const isGoal = card.type === "Goal";

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
      style={{
        borderWidth: "0.5px",
        opacity: isDragging ? 0.4 : 1,
        borderLeft: isGoal ? "3px solid var(--foreground)" : undefined,
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
