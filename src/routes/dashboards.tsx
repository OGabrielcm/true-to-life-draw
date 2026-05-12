import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useKanban } from "@/lib/kanban-store";
import { COLUMNS, formatDate } from "@/lib/kanban-types";
import { CardDetailModal } from "@/components/kanban/CardDetailModal";

export const Route = createFileRoute("/dashboards")({
  component: DashboardsPage,
  head: () => ({ meta: [{ title: "Dashboards — Molas" }] }),
});

function DashboardsPage() {
  const { cards, trilhas, tracks, moveCard, deleteCard, toggleStar } = useKanban();
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
      <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold">Dashboards</h2>
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrar..."
              className="w-full rounded-md border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-foreground/40 sm:w-52"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border" style={{ borderWidth: "0.5px" }}>
          <table className="min-w-[680px] w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Title</th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Track</th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Priority</th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Deadline</th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Updated</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const track = tracks.find((t) => t.id === c.track);
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
