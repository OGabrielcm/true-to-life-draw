import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Layers, Columns, Check, ArrowRight, LogOut } from "lucide-react";
import { useKanban } from "@/lib/kanban-store";
import { useAuth } from "@/lib/auth-store";
import { useUserProfile } from "@/lib/user-profile-store";
import { TRACK_COLOR_PRESETS } from "@/lib/kanban-types";

type Step = "track" | "column" | "saving";

export function OnboardingBeta() {
  const { createTrack, createColumn, tracks, columns } = useKanban();
  const { markOnboardingCompleted } = useUserProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("track");
  const [trackName, setTrackName] = useState("");
  const [columnName, setColumnName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resiliente a refresh: se o usuário já criou no banco e voltou, pula o step.
  const hasTrack = tracks.length > 0;
  const hasColumn = columns.length > 0;

  const handleSubmitTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = trackName.trim();
    if (!name) {
      setError("Dê um nome para sua trilha.");
      return;
    }
    setSubmitting(true);
    setError(null);
    // Cor padrão automática (Beta = mínimo essencial).
    const preset = TRACK_COLOR_PRESETS[0];
    await createTrack({
      name,
      bg: preset.bg,
      border: preset.border,
      fg: preset.fg,
      darkBg: preset.darkBg,
      darkFg: preset.darkFg,
    });
    setSubmitting(false);
    setStep("column");
  };

  const handleSubmitColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = columnName.trim();
    if (!name) {
      setError("Dê um nome para sua coluna.");
      return;
    }
    setSubmitting(true);
    setError(null);
    await createColumn(name);
    await markOnboardingCompleted();
    setSubmitting(false);
    // Sinaliza pro /settings que o usuário acabou de sair do onboarding
    // (highlight transitório). sessionStorage some ao fechar a aba.
    sessionStorage.setItem("molas_onboarding_just_completed", "1");
    navigate({ to: "/settings" });
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
          <span
            className="text-2xl font-semibold uppercase tracking-widest text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Molas
          </span>
          <span className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <Indicator active={step === "track"} done={hasTrack && step !== "track"} label="Trilha" />
          <div className="h-px w-8 bg-border" />
          <Indicator active={step === "column"} done={hasColumn} label="Coluna" />
        </div>

        {step === "track" && (
          <form onSubmit={handleSubmitTrack} className="flex flex-col gap-4 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h2
                className="text-lg font-semibold uppercase tracking-widest text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Crie sua primeira trilha
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Trilhas são as áreas em que você organiza seu trabalho (ex.: Trabalho, Estudos, Projetos pessoais).
              Você pode criar mais depois.
            </p>
            <input
              autoFocus
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="Nome da trilha"
              className="w-full rounded-sm border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40 transition-colors"
            />
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
          <form onSubmit={handleSubmitColumn} className="flex flex-col gap-4 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <Columns className="h-4 w-4 text-muted-foreground" />
              <h2
                className="text-lg font-semibold uppercase tracking-widest text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Crie sua primeira coluna
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Colunas são os estágios pelos quais os cards passam (ex.: A fazer, Em andamento, Concluído).
            </p>
            <div className="rounded-sm border border-dashed bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
              As colunas criadas aqui serão o padrão do sistema e podem ser editadas a qualquer momento.
            </div>
            <input
              autoFocus
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="Nome da coluna"
              className="w-full rounded-sm border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40 transition-colors"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !columnName.trim()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-sm bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}
            >
              Confirmar e abrir configurações
              <Check className="h-3.5 w-3.5" />
            </button>
          </form>
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
