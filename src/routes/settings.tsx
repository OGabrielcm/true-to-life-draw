import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, Columns, Pencil } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useKanban } from "@/lib/kanban-store";
import { TracksModal } from "@/components/kanban/TracksModal";
import { ColumnsModal } from "@/components/kanban/ColumnsModal";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: "Configurações — Molas" }],
  }),
});

function SettingsPage() {
  const {
    tracks,
    columns,
    createTrack,
    updateTrack,
    deleteTrack,
    createColumn,
    updateColumn,
    deleteColumn,
    getColumnsForTrack,
  } = useKanban();

  const [tracksOpen, setTracksOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState<string | false>(false);
  const [fromOnboarding, setFromOnboarding] = useState(false);

  useEffect(() => {
    const flag = sessionStorage.getItem("molas_onboarding_just_completed");
    if (flag) {
      setFromOnboarding(true);
      sessionStorage.removeItem("molas_onboarding_just_completed");
      // Esconde o destaque depois de uns segundos.
      const t = setTimeout(() => setFromOnboarding(false), 6000);
      return () => clearTimeout(t);
    }
  }, []);

  const globalColumns = columns.filter((c) => !c.track_id).sort((a, b) => a.order - b.order);

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-1">
          <h1
            className="text-2xl font-semibold uppercase tracking-widest text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas trilhas e colunas. É aqui que você cria, edita e remove os elementos do
            seu board.
          </p>
        </header>

        {fromOnboarding && (
          <div className="rounded-lg border border-foreground/30 bg-foreground/5 px-4 py-3 text-xs text-foreground animate-in fade-in slide-in-from-top-2 duration-500">
            <strong className="font-semibold">É aqui que você gerencia tudo.</strong> Crie mais
            trilhas e colunas, edite as existentes ou ajuste cores quando quiser.
          </div>
        )}

        {/* Trilhas */}
        <section
          className={`rounded-lg border bg-card p-5 transition-shadow ${
            fromOnboarding ? "ring-2 ring-foreground/40" : ""
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h2
                className="text-sm font-semibold uppercase tracking-widest text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Trilhas
              </h2>
              <span className="text-xs text-muted-foreground">({tracks.length})</span>
            </div>
            <button
              onClick={() => setTracksOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-sm border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              style={{ borderWidth: "0.5px" }}
            >
              <Pencil className="h-3 w-3" />
              Gerenciar
            </button>
          </div>
          {tracks.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma trilha ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {tracks.map((tr) => (
                <li
                  key={tr.id}
                  className="flex items-center gap-2 rounded-sm border px-3 py-2 text-sm"
                  style={{ borderWidth: "0.5px" }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tr.border }}
                  />
                  <span className="text-foreground">{tr.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {getColumnsForTrack(tr.id).length} colunas
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Colunas globais */}
        <section
          className={`rounded-lg border bg-card p-5 transition-shadow ${
            fromOnboarding ? "ring-2 ring-foreground/40" : ""
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Columns className="h-4 w-4 text-muted-foreground" />
              <h2
                className="text-sm font-semibold uppercase tracking-widest text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Colunas padrão
              </h2>
              <span className="text-xs text-muted-foreground">({globalColumns.length})</span>
            </div>
            <button
              onClick={() => setColumnsOpen("__global")}
              className="inline-flex items-center gap-1.5 rounded-sm border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              style={{ borderWidth: "0.5px" }}
            >
              <Pencil className="h-3 w-3" />
              Gerenciar
            </button>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Colunas padrão são usadas por todas as trilhas que não têm colunas específicas.
          </p>
          {globalColumns.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma coluna ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {globalColumns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-sm border px-3 py-2 text-sm"
                  style={{ borderWidth: "0.5px" }}
                >
                  <span className="text-foreground">{c.name}</span>
                  {c.wip_limit != null && (
                    <span className="text-xs text-muted-foreground">WIP {c.wip_limit}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {tracksOpen && (
        <TracksModal
          tracks={tracks}
          onClose={() => setTracksOpen(false)}
          onCreate={createTrack}
          onUpdate={updateTrack}
          onDelete={deleteTrack}
        />
      )}
      {columnsOpen && (
        <ColumnsModal
          columns={
            columnsOpen === "__global"
              ? columns.filter((c) => !c.track_id)
              : getColumnsForTrack(columnsOpen)
          }
          trackId={columnsOpen === "__global" ? undefined : columnsOpen}
          trackName={
            columnsOpen === "__global"
              ? undefined
              : tracks.find((tr) => tr.id === columnsOpen)?.name
          }
          onClose={() => setColumnsOpen(false)}
          onCreate={createColumn}
          onUpdate={updateColumn}
          onDelete={deleteColumn}
        />
      )}
    </AppShell>
  );
}
