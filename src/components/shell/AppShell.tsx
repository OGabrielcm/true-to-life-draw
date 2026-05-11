import { type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Moon,
  Sun,
  Home,
  Star,
  User,
  LayoutDashboard,
  ChevronDown,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useKanban } from "@/lib/kanban-store";
import { useAuth } from "@/lib/auth-store";
import { TRACKS } from "@/lib/kanban-types";
import { CreateCardModal } from "@/components/kanban/CreateCardModal";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/for-you", label: "For You", icon: Star },
  { to: "/dashboards", label: "Dashboards", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
];

function initials(email: string | undefined) {
  if (!email) return "?";
  return email.slice(0, 2).toUpperCase();
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { search, setSearch, setCreateOpen, createOpen } = useKanban();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tracksOpen, setTracksOpen] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  const scrollToTrack = (id: string) => {
    if (path !== "/") return;
    const el = document.getElementById(`track-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    setAvatarOpen(false);
    await signOut();
    navigate({ to: "/login" });
  };

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r bg-sidebar transition-transform md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderWidth: "0.5px" }}
      >
        <div className="flex h-12 items-center justify-between px-4 border-b" style={{ borderWidth: "0.5px" }}>
          <span className="text-sm font-semibold">🌀 Molas</span>
          <button className="md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3 text-sm">
          {NAV.map((n) => {
            const active = path === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors ${
                  active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
          <div className="mt-2">
            <button
              onClick={() => setTracksOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span>Tracks</span>
              <ChevronDown
                className="h-3.5 w-3.5 transition-transform"
                style={{ transform: tracksOpen ? "rotate(0)" : "rotate(-90deg)" }}
              />
            </button>
            {tracksOpen && (
              <div className="ml-2 mt-1 flex flex-col gap-1 border-l pl-2" style={{ borderWidth: "0.5px" }}>
                {TRACKS.map((t) => (
                  <Link
                    key={t.id}
                    to="/"
                    hash={`track-${t.id}`}
                    onClick={() => scrollToTrack(t.id)}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.border }} />
                    {t.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Log Out at bottom */}
          <button
            onClick={handleSignOut}
            className="mt-auto flex items-center gap-2 rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0">
        <header
          className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur sm:px-5"
          style={{ borderWidth: "0.5px" }}
        >
          <button className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="hidden text-sm font-medium sm:block">Gerenciador de Molas</h1>
          <div className="relative ml-2 flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarefas..."
              className="w-full rounded-md border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Create</span>
          </button>
          <button
            onClick={toggle}
            aria-label="Alternar tema"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Avatar dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => setAvatarOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground hover:ring-2 hover:ring-foreground/20"
              title={user.email}
            >
              {initials(user.email)}
            </button>
            {avatarOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setAvatarOpen(false)}
                />
                <div
                  className="absolute right-0 top-9 z-20 min-w-[180px] rounded-lg border bg-background py-1 shadow-md"
                  style={{ borderWidth: "0.5px" }}
                >
                  <div className="border-b px-3 py-2 text-xs text-muted-foreground" style={{ borderWidth: "0.5px" }}>
                    {user.email}
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <User className="h-3.5 w-3.5" />
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-muted dark:text-red-400"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {createOpen && <CreateCardModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
