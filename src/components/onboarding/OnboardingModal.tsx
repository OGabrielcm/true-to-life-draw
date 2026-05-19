import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useKanban } from "@/lib/kanban-store";

const STORAGE_KEY = "molas_onboarding_v1";

export function OnboardingModal() {
  const { user } = useAuth();
  const { cards, tracks, loading } = useKanban();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    // Camada 1 — localStorage
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Camada 2 — só exibe para usuários genuinamente novos (sem dados)
    const isNewUser = tracks.length === 0 && cards.length === 0;
    if (isNewUser) {
      setVisible(true);
    } else {
      localStorage.setItem(STORAGE_KEY, "seen");
    }
  }, [loading, user, tracks.length, cards.length]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === "onboarding:close") handleClose();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "seen");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm">
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 z-10 inline-flex h-8 items-center gap-1.5 rounded-sm bg-foreground px-4 text-xs font-semibold text-background hover:opacity-90 transition-opacity"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "0.08em", textTransform: "uppercase" }}
      >
        <X className="h-3.5 w-3.5" />
        Fechar
      </button>
      <iframe
        src="/onboarding.html"
        className="h-full w-full border-0"
        title="Tour de boas-vindas"
      />
    </div>
  );
}
