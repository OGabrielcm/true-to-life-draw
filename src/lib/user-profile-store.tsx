import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-store";
import { useTheme, type Theme } from "@/components/theme-provider";

interface UserProfileCtx {
  onboardingCompleted: boolean | null;
  loading: boolean;
  markOnboardingCompleted: () => Promise<void>;
  // Persiste a preferência de tema do usuário no Supabase (cross-device).
  setThemePreference: (theme: Theme) => Promise<void>;
}

const Ctx = createContext<UserProfileCtx | null>(null);

const VALID_THEMES = new Set<Theme>(["dark", "light", "babyblue", "sepia"]);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  // ThemeProvider é ancestral deste provider (ver __root.tsx) → pode consumir.
  const { setThemeFromRemote } = useTheme();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOnboardingCompleted(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Leitura BEST-EFFORT do tema, ISOLADA do caminho crítico. Se a coluna
    // `theme` ainda não existir (migration não aplicada) ou falhar, isso NUNCA
    // pode afetar o loading nem o onboarding — o board já renderiza com o tema
    // do localStorage (princípio anti-2.1: tema nunca bloqueia render).
    const loadThemePreference = async () => {
      try {
        const { data, error } = await supabase
          .from("user_profile")
          .select("theme")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled || error || !data) return;
        const remote = (data as { theme?: string }).theme;
        if (remote && VALID_THEMES.has(remote as Theme)) {
          setThemeFromRemote(remote as Theme);
        }
      } catch {
        // silencioso — tema fica no default do localStorage
      }
    };

    const run = async () => {
      setLoading(true);
      // Caminho CRÍTICO: só onboarding_completed controla o loading/render.
      const { data } = await supabase
        .from("user_profile")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setOnboardingCompleted(Boolean(data.onboarding_completed));
      } else {
        // Cria a row lazy na primeira sessão (default false).
        const { data: inserted } = await supabase
          .from("user_profile")
          .insert({ user_id: user.id, onboarding_completed: false })
          .select("onboarding_completed")
          .single();
        if (!cancelled) setOnboardingCompleted(Boolean(inserted?.onboarding_completed));
      }
      if (!cancelled) setLoading(false);

      // Tema em paralelo/depois — falha aqui não toca o estado crítico acima.
      void loadThemePreference();
    };

    // Deduplica chamadas concorrentes (StrictMode + onAuthStateChange).
    if (!inFlightRef.current) {
      inFlightRef.current = run().finally(() => {
        inFlightRef.current = null;
      });
    }

    return () => {
      cancelled = true;
    };
    // Chaveia por user?.id (primitivo estável), não pelo objeto `user`, que o
    // auth-store recria a cada setSession — evita re-runs espúrios que poderiam
    // cancelar o load em voo no reload (mesma classe de bug do Bloco 2.1).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  const markOnboardingCompleted = async () => {
    if (!user) return;
    setOnboardingCompleted(true);
    await supabase
      .from("user_profile")
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  };

  const setThemePreference = async (theme: Theme) => {
    if (!user || !VALID_THEMES.has(theme)) return;
    // Best-effort: a UI já aplicou via localStorage; aqui só sincroniza o DB.
    await supabase
      .from("user_profile")
      .update({ theme, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  };

  return (
    <Ctx.Provider
      value={{ onboardingCompleted, loading, markOnboardingCompleted, setThemePreference }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useUserProfile() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUserProfile must be used inside UserProfileProvider");
  return v;
}
