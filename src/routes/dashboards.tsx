import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useKanban } from "@/lib/kanban-store";
import { TRACKS, COLUMNS, formatDate } from "@/lib/kanban-types";
import { CardDetailModal } from "@/components/kanban/CardDetailModal";

export const Route = createFileRoute("/dashboards")({
  component: DashboardsPage,
  head: () => ({ meta: [{ title: "Dashboards — Molas" }] }),
});

function DashboardsPage() {
  const { cards, trilhas, moveCard, deleteCard, toggleStar } = useKanban();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...cards]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .filter((c) =>
        !query || c.title.toLowerCase().includes(query) || (c.desc ?? "").toLowerCase().includes(query),
      );
  }, [cards, q]);

  const open = openId ? cards.find((c) => c.id === openId) ?? null : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Dashboards</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrar..."
              className="rounded-md border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border" style={{ borderWidth: "0.5px" }}>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Track</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Priority</th>
                <th className="px-3 py-2 text-left font-medium">Deadline</th>
                <th className="px-3 py-2 text-left font-medium">Updated</th>
                <th className="px-3 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const track = TRACKS.find((t) => t.id === c.track);
                const col = COLUMNS.find((x) => x.id === c.col);
                return (
                  <tr key={c.id} className="border-t" style={{ borderWidth: "0.5px" }}>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setOpenId(c.id)}
                        className="text-left font-medium text-foreground hover:underline"
                      >
                        {c.title}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: track?.bg, color: track?.fg }}>
                        {track?.name}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{col?.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.prio}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(c.date)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(c.updated_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setOpenId(c.id)}
                        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => { if (confirm("Excluir card?")) deleteCard(c.id); }}
                        className="ml-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label="Excluir"
                      >
                        <Trash2 className="inline h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">Nenhum card.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <CardDetailModal
          card={open}
          allCards={cards}
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
