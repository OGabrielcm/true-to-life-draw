import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/shell/AppShell";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Molas" }] }),
});

const KEY = "kb_profile";

function load() {
  if (typeof window === "undefined") return { name: "", email: "" };
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "") || { name: "", email: "" };
  } catch {
    return { name: "", email: "" };
  }
}

function ProfilePage() {
  const [profile, setProfile] = useState(load);
  const [saved, setSaved] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(KEY, JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6 p-6">
        <h2 className="text-base font-semibold">Profile</h2>
        <form onSubmit={save} className="space-y-3 rounded-xl border p-5" style={{ borderWidth: "0.5px" }}>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              Salvar
            </button>
            {saved && <span className="text-xs text-muted-foreground">Salvo ✓</span>}
          </div>
        </form>
        <p className="text-xs text-muted-foreground">
          Modo local — sem autenticação. Dados salvos no navegador.
        </p>
      </div>
    </AppShell>
  );
}
