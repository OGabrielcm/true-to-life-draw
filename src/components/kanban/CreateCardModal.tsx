import { AddCardModal } from "./AddCardModal";
import { useKanban } from "@/lib/kanban-store";

export function CreateCardModal({ onClose }: { onClose: () => void }) {
  const { trilhas, tracks, cards, addCard } = useKanban();
  const goals = cards.filter((c) => c.type === "Goal");
  const firstTrack = tracks[0]?.id ?? "";
  if (!firstTrack) {
    // Sem tracks ainda — fecha o modal automaticamente
    onClose();
    return null;
  }
  return (
    <AddCardModal
      column="todo"
      track={firstTrack}
      tracks={tracks}
      trilhas={trilhas}
      goals={goals}
      allowTrackPick
      allowColPick
      onClose={onClose}
      onAdd={addCard}
    />
  );
}
