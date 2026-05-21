import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-store";

interface UserProfileCtx {
  onboardingCompleted: boolean | null;
  loading: boolean;
  markOnboardingCompleted: () => Promise<void>;
}

const Ctx = createContext<UserProfileCtx | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
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
    const run = async () => {
      setLoading(true);
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
  }, [user, authLoading]);

  const markOnboardingCompleted = async () => {
    if (!user) return;
    setOnboardingCompleted(true);
    await supabase
      .from("user_profile")
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  };

  return (
    <Ctx.Provider value={{ onboardingCompleted, loading, markOnboardingCompleted }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUserProfile() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUserProfile must be used inside UserProfileProvider");
  return v;
}
