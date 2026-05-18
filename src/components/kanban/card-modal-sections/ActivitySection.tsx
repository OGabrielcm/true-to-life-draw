import { useState } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { useKanban } from "@/lib/kanban-store";

export function ActivitySection({ cardId }: { cardId: string }) {
  const { activitiesByCard } = useKanban();
  const activities = activitiesByCard[cardId] ?? [];
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? activities : activities.slice(0, 5);

  if (activities.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <ActivityIcon className="h-3 w-3" />
        Atividades ({activities.length})
      </p>
      <div className="space-y-0.5">
        {visible.map((a) => (
          <div
            key={a.id}
            className="flex items-baseline gap-2 rounded px-1 py-0.5 text-xs text-muted-foreground"
          >
            <span className="shrink-0 text-[10px] tabular-nums">
              {new Date(a.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex-1 text-foreground/80">{a.message}</span>
          </div>
        ))}
      </div>
      {activities.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Mostrar menos" : `Ver todas (${activities.length})`}
        </button>
      )}
    </div>
  );
}
