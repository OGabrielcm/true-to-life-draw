import { Flame } from "lucide-react";
import { DEFAULT_HABIT_COLOR } from "@/lib/habit-types";

// Badge de streak reutilizável (extraído do padrão de habits.tsx). Usado no
// Dashboard e no For You. `label` opcional aparece após o número (ex: "recorde").
export function StreakBadge({
  count,
  color = DEFAULT_HABIT_COLOR,
  label,
  title,
}: {
  count: number;
  color?: string;
  label?: string;
  title?: string;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}1a`, color }}
      title={title}
    >
      <Flame className="h-3 w-3" />
      {count}
      {label && <span className="opacity-70">{label}</span>}
    </span>
  );
}
