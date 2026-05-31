import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/(auth)/signup")({
  component: SignUpPage,
  head: () => ({ meta: [{ title: "Criar conta — Molas" }] }),
});

function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setBusy(true);
    setError("");
    const err = await signUp(email, password);
    setBusy(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <span className="text-3xl">✉️</span>
          <h1 className="mt-4 text-base font-semibold">Verifique seu email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>. Após confirmar, faça
            login.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Ir para login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-3xl">🌀</span>
          <h1 className="mt-2 text-xl font-semibold text-foreground">Molas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Crie sua conta</p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
          style={{ borderWidth: "0.5px" }}
        >
          <h2 className="text-sm font-semibold">Nova conta</h2>

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
            <label className="text-xs font-medium text-muted-foreground">
              Senha <span className="text-muted-foreground/60">(mín. 6 caracteres)</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-foreground py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Já tem conta?{" "}
          <a href="/login" className="underline hover:text-foreground">
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}
