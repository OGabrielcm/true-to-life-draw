import { AddCardModal } from "./AddCardModal";
import { useKanban } from "@/lib/kanban-store";

export function CreateCardModal({ onClose }: { onClose: () => void }) {
  const { trilhas, cards, addCard } = useKanban();
  const goals = cards.filter((c) => c.type === "Goal");
  return (
    <AddCardModal
      column="todo"
      track="estagio"
      trilhas={trilhas}
      goals={goals}
      allowTrackPick
      allowColPick
      onClose={onClose}
      onAdd={addCard}
    />
  );
}
