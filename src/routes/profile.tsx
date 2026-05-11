import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Molas" }] }),
});

function ProfilePage() {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      setStatus("error");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setErrorMsg("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setPassword("");
      setConfirmPassword("");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6 p-6">
        <h2 className="text-base font-semibold">Profile</h2>

        {/* Account info */}
        <div className="rounded-xl border p-5 space-y-3" style={{ borderWidth: "0.5px" }}>
          <h3 className="text-sm font-medium">Conta</h3>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <p className="mt-1 text-sm text-foreground">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">ID</label>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{user?.id}</p>
          </div>
        </div>

        {/* Change password */}
        <form
          onSubmit={changePassword}
          className="rounded-xl border p-5 space-y-3"
          style={{ borderWidth: "0.5px" }}
        >
          <h3 className="text-sm font-medium">Alterar senha</h3>

          {status === "error" && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              {errorMsg}
            </p>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {status === "saving" ? "Salvando..." : "Alterar senha"}
            </button>
            {status === "saved" && (
              <span className="text-xs text-muted-foreground">Senha alterada ✓</span>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
