import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Login — Molas" }] }),
});

function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    navigate({ to: "/" });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const err = await signIn(email, password);
    if (err) {
      setError(err);
      setBusy(false);
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-3xl">🌀</span>
          <h1 className="mt-2 text-xl font-semibold text-foreground">Molas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Seu Kanban pessoal</p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border bg-background p-6"
          style={{ borderWidth: "0.5px" }}
        >
          <h2 className="text-sm font-semibold">Entrar</h2>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-foreground py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Não tem conta?{" "}
          <a href="/signup" className="underline hover:text-foreground">
            Criar conta
          </a>
        </p>
      </div>
    </div>
  );
}
