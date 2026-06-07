import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Layers, Columns, Check, ArrowRight, LogOut, Plus, X } from "lucide-react";
import { useKanban } from "@/lib/kanban-store";
import { useAuth } from "@/lib/auth-store";
import { useUserProfile } from "@/lib/user-profile-store";
import { TRACK_COLOR_PRESETS } from "@/lib/kanban-types";

type Step = "track" | "column";

export function OnboardingBeta() {
  const { createTrack, createColumn, tracks, columns } = useKanban();
  const { markOnboardingCompleted } = useUserProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("track");
  const [trackName, setTrackName] = useState("");
  const [trackColor, setTrackColor] = useState(TRACK_COLOR_PRESETS[0]);
  // Lista local de colunas que o usuário monta antes de persistir.
  const [pendingColumns, setPendingColumns] = useState<string[]>([]);
  const [columnInput, setColumnInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const columnInputRef = useRef<HTMLInputElement>(null);

  const hasTrack = tracks.length > 0;
  const hasColumn = columns.length > 0 || pendingColumns.length > 0;

  const handleSubmitTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = trackName.trim();
    if (!name) { setError("Dê um nome para sua trilha."); return; }
    setSubmitting(true);
    setError(null);
    await createTrack({ name, bg: trackColor.bg, border: trackColor.border, fg: trackColor.fg, darkBg: trackColor.darkBg, darkFg: trackColor.darkFg });
    setSubmitting(false);
    setStep("column");
  };

  const addPendingColumn = () => {
    const name = columnInput.trim();
    if (!name) return;
    if (pendingColumns.includes(name)) { setError("Já existe uma coluna com esse nome."); return; }
    setPendingColumns((prev) => [...prev, name]);
    setColumnInput("");
    setError(null);
    columnInputRef.current?.focus();
  };

  const removePendingColumn = (name: string) => {
    setPendingColumns((prev) => prev.filter((c) => c !== name));
  };

  const handleColumnInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addPendingColumn(); }
  };

  const handleConfirm = async () => {
    if (pendingColumns.length === 0) { setError("Adicione ao menos uma coluna antes de continuar."); return; }
    setSubmitting(true);
    setError(null);
    for (const name of pendingColumns) {
      await createColumn(name);
    }
    await markOnboardingCompleted();
    setSubmitting(false);
    sessionStorage.setItem("molas_onboarding_just_completed", "1");
    navigate({ to: "/" });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background px-6 py-10">
      <button
        onClick={() => signOut()}
        className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        style={{ borderWidth: "0.5px" }}
      >
        <LogOut className="h-3.5 w-3.5" />
        Sair
      </button>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-2xl font-semibold uppercase tracking-widest text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Molas
          </span>
          <span className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <Indicator active={step === "track"} done={hasTrack && step !== "track"} label="Trilha" />
          <div className="h-px w-8 bg-border" />
          <Indicator active={step === "column"} done={hasColumn && step !== "column"} label="Colunas" />
        </div>

        {step === "track" && (
          <form onSubmit={handleSubmitTrack} className="flex flex-col gap-4 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold uppercase tracking-widest text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Crie sua primeira trilha
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Trilhas são as áreas em que você organiza seu trabalho (ex.: Trabalho, Estudos, Projetos pessoais). Você pode criar mais depois.
            </p>
            <input
              autoFocus
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="Nome da trilha"
              className="w-full rounded-sm border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40 transition-colors"
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Cor</span>
              <div className="flex flex-wrap gap-2">
                {TRACK_COLOR_PRESETS.map((c) => (
                  <button
                    key={c.bg}
                    type="button"
                    onClick={() => setTrackColor(c)}
                    className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c.bg,
                      outline: c.bg === trackColor.bg ? `2px solid ${c.fg}` : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !trackName.trim()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-sm bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}
            >
              Continuar
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        {step === "column" && (
          <div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <Columns className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold uppercase tracking-widest text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Crie suas colunas
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Colunas são os estágios pelos quais os cards passam (ex.: A fazer, Em andamento, Concluído). Adicione quantas quiser.
            </p>
            <div className="rounded-sm border border-dashed bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
              As colunas criadas aqui serão o padrão do sistema e podem ser editadas a qualquer momento.
            </div>

            {/* Lista de colunas pendentes */}
            {pendingColumns.length > 0 && (
              <ul className="flex flex-col gap-1">
                {pendingColumns.map((name) => (
                  <li key={name} className="flex items-center justify-between rounded-sm border px-3 py-1.5 text-sm" style={{ borderWidth: "0.5px" }}>
                    <span className="text-foreground">{name}</span>
                    <button type="button" onClick={() => removePendingColumn(name)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Input para adicionar coluna */}
            <div className="flex gap-2">
              <input
                ref={columnInputRef}
                autoFocus
                value={columnInput}
                onChange={(e) => { setColumnInput(e.target.value); setError(null); }}
                onKeyDown={handleColumnInputKeyDown}
                placeholder="Nome da coluna"
                className="flex-1 rounded-sm border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40 transition-colors"
              />
              <button
                type="button"
                onClick={addPendingColumn}
                disabled={!columnInput.trim()}
                className="inline-flex h-9 items-center gap-1 rounded-sm border px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ borderWidth: "0.5px" }}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || pendingColumns.length === 0}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-sm bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}
            >
              {submitting ? "Salvando..." : "Confirmar e abrir configurações"}
              {!submitting && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Indicator({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  const base = "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-widest";
  const cls = done
    ? "bg-foreground text-background"
    : active
    ? "border border-foreground text-foreground"
    : "border border-border text-muted-foreground";
  return (
    <div className={`${base} ${cls}`} style={{ fontFamily: "var(--font-display)" }}>
      {done && <Check className="h-3 w-3" />}
      {label}
    </div>
  );
}
