import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Redefinir senha — Molas" }] }),
});

function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // O Supabase processa o token da hash e emite PASSWORD_RECOVERY via onAuthStateChange.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    setError("");
    const err = await updatePassword(password);
    setBusy(false);
    if (err) {
      setError(err);
    } else {
      setDone(true);
      setTimeout(() => navigate({ to: "/" }), 2500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-3xl">🌀</span>
          <h1 className="mt-2 text-xl font-semibold text-foreground">Molas</h1>
        </div>

        {done ? (
          <div className="rounded-xl border bg-background p-6 text-center space-y-2" style={{ borderWidth: "0.5px" }}>
            <span className="text-2xl">✅</span>
            <h2 className="text-sm font-semibold">Senha redefinida</h2>
            <p className="text-xs text-muted-foreground">Redirecionando para o app...</p>
          </div>
        ) : !ready ? (
          <div className="rounded-xl border bg-background p-6 text-center space-y-2" style={{ borderWidth: "0.5px" }}>
            <p className="text-sm text-muted-foreground">Validando link de recuperação...</p>
            <p className="text-xs text-muted-foreground">
              Se demorar muito,{" "}
              <a href="/login" className="underline hover:text-foreground">
                volte para o login
              </a>{" "}
              e solicite um novo link.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-xl border bg-background p-6"
            style={{ borderWidth: "0.5px" }}
          >
            <h2 className="text-sm font-semibold">Redefinir senha</h2>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground">Nova senha</label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                style={{ borderWidth: "0.5px" }}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Confirmar senha</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                style={{ borderWidth: "0.5px" }}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={busy || !password || !confirm}
              className="w-full rounded-md bg-foreground py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
