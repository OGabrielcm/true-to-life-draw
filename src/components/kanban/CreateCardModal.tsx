import { AddCardModal } from "./AddCardModal";
import { useKanban } from "@/lib/kanban-store";

export function CreateCardModal({ onClose }: { onClose: () => void }) {
  const { trilhas, tracks, columns, cards, templates, addCard } = useKanban();
  const goals = cards.filter((c) => c.type === "Goal");
  const firstTrack = tracks[0]?.id ?? "";
  const firstColumn = columns[0]?.id ?? "todo";
  if (!firstTrack) {
    onClose();
    return null;
  }
  return (
    <AddCardModal
      column={firstColumn}
      track={firstTrack}
      tracks={tracks}
      columns={columns}
      trilhas={trilhas}
      goals={goals}
      templates={templates}
      allowTrackPick
      allowColPick
      onClose={onClose}
      onAdd={addCard}
    />
  );
}
