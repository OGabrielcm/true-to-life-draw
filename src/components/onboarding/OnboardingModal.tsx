import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "molas_onboarding_v1";

export function OnboardingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === "onboarding:close") close();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, "seen");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <button
        onClick={close}
        className="absolute right-4 top-4 z-10 inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
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
