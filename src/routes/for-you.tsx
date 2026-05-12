import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { useKanban } from "@/lib/kanban-store";
import { CardItem } from "@/components/kanban/CardItem";
import { CardDetailModal } from "@/components/kanban/CardDetailModal";

export const Route = createFileRoute("/for-you")({
  component: ForYouPage,
  head: () => ({ meta: [{ title: "For You — Molas" }] }),
});

function ForYouPage() {
  const { cards, trilhas, tracks, moveCard, deleteCard, toggleStar } = useKanban();
  const [openId, setOpenId] = useState<string | null>(null);

  const recent = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return [...cards]
      .filter((c) => new Date(c.updated_at).getTime() >= cutoff)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 12);
  }, [cards]);

  const starred = useMemo(() => cards.filter((c) => c.starred), [cards]);
  const open = openId ? cards.find((c) => c.id === openId) ?? null : null;

  const renderGrid = (list: typeof cards) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((c) => {
        const track = tracks.find((t) => t.id === c.track);
        return (
          <div key={c.id} className="rounded-lg border p-1" style={{ borderWidth: "0.5px", borderLeft: `3px solid ${track?.border}` }}>
            <CardItem
              card={c}
              trilhas={trilhas}
              onClick={() => setOpenId(c.id)}
              onDragStart={() => {}}
              onDragEnd={() => {}}
              isDragging={false}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
        <section>
          <h2 className="mb-3 text-base font-semibold">Recently worked on</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade nos últimos 7 dias.</p>
          ) : renderGrid(recent)}
        </section>
        <section>
          <h2 className="mb-3 text-base font-semibold">Starred items</h2>
          {starred.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum card favoritado. Use a estrela no modal de detalhe.</p>
          ) : renderGrid(starred)}
        </section>
      </div>
      {open && (
        <CardDetailModal
          card={open}
          allCards={cards}
          tracks={tracks}
          trilhas={trilhas}
          onClose={() => setOpenId(null)}
          onMove={moveCard}
          onDelete={deleteCard}
          onToggleStar={toggleStar}
        />
      )}
    </AppShell>
  );
}
