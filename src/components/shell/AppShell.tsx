import { type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Home,
  Star,
  User,
  LayoutDashboard,
  Calendar,
  ChevronDown,
  Menu,
  X,
  LogOut,
  LayoutTemplate,
  Settings,
  Palette,
  Check,
} from "lucide-react";
import { useTheme, THEMES } from "@/components/theme-provider";
import { useKanban } from "@/lib/kanban-store";
import { useAuth } from "@/lib/auth-store";
import { useUserProfile } from "@/lib/user-profile-store";
import { OnboardingBeta } from "@/components/onboarding/OnboardingBeta";
import { getDeadlineStatus } from "@/lib/kanban-types";
import { CreateCardModal } from "@/components/kanban/CreateCardModal";
import { TemplatesModal } from "@/components/kanban/TemplatesModal";
import { useLocale } from "@/lib/locale-context";

const NAV_KEYS = [
  { to: "/", labelKey: "nav_home" as const, icon: Home },
  { to: "/for-you", labelKey: "nav_for_you" as const, icon: Star },
  { to: "/calendar", labelKey: "nav_calendar" as const, icon: Calendar },
  { to: "/dashboards", labelKey: "nav_dashboards" as const, icon: LayoutDashboard },
  { to: "/settings", labelKey: "nav_settings" as const, icon: Settings },
  { to: "/profile", labelKey: "nav_profile" as const, icon: User },
];

function initials(email: string | undefined) {
  if (!email) return "?";
  return email.slice(0, 2).toUpperCase();
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const {
    search,
    setSearch,
    setCreateOpen,
    createOpen,
    tracks,
    cards,
    trackFilter,
    setTrackFilter,
  } = useKanban();
  const urgentCount = cards.filter((c) => {
    const s = getDeadlineStatus(c);
    return s === "overdue" || s === "today";
  }).length;
  const { user, loading, signOut } = useAuth();
  const { onboardingCompleted, loading: profileLoading, setThemePreference } = useUserProfile();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tracksOpen, setTracksOpen] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  const handleTrackClick = (id: string) => {
    // Toggle: clicar na mesma trilha ativa desfaz o filtro.
    const next = trackFilter === id ? "__all" : id;
    setTrackFilter(next);
    setMobileOpen(false);
    if (path !== "/") navigate({ to: "/" });
  };

  const handleSignOut = async () => {
    setAvatarOpen(false);
    await signOut();
    navigate({ to: "/login" });
  };

  if (loading || profileLoading) return <AppSkeleton />;
  if (!user) return null;

  // Bloqueia o app até o usuário completar o Onboarding Beta.
  if (onboardingCompleted === false) {
    return <OnboardingBeta />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[220px] shrink-0 flex-col border-r bg-sidebar transition-transform md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-semibold uppercase tracking-widest text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Molas
            </span>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
          </div>
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3 text-[13px]">
          {NAV_KEYS.map((n) => {
            const active = path === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-sm px-2.5 py-[7px] transition-colors ${
                  active
                    ? "nav-item-active text-foreground"
                    : "nav-item-hover text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {t(n.labelKey)}
              </Link>
            );
          })}

          {/* Tracks */}
          <div className="mt-3">
            <button
              onClick={() => setTracksOpen((v) => !v)}
              className="flex w-full items-center justify-between px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span>{t("tracks")}</span>
              <ChevronDown
                className="h-3 w-3 transition-transform"
                style={{ transform: tracksOpen ? "rotate(0)" : "rotate(-90deg)" }}
              />
            </button>
            {tracksOpen && (
              <div className="ml-1 mt-0.5 flex flex-col gap-0.5 border-l pl-2">
                {/* "Todos" — reseta o filtro de track */}
                <button
                  type="button"
                  onClick={() => {
                    setTrackFilter("__all");
                    setMobileOpen(false);
                    if (path !== "/") navigate({ to: "/" });
                  }}
                  className={`flex items-center gap-2 rounded-sm px-2 py-1 text-xs transition-colors ${
                    trackFilter === "__all"
                      ? "nav-item-active text-foreground font-medium"
                      : "nav-item-hover text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                  {t("all")}
                </button>
                {tracks.map((tr) => {
                  const active = trackFilter === tr.id;
                  return (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => handleTrackClick(tr.id)}
                      aria-pressed={active}
                      className={`flex items-center justify-between rounded-sm px-2 py-1 text-xs transition-colors ${
                        active
                          ? "nav-item-active text-foreground font-medium"
                          : "nav-item-hover text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: tr.border }}
                        />
                        {tr.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Templates */}
          <button
            onClick={() => {
              setTemplatesOpen(true);
              setMobileOpen(false);
            }}
            className="mt-1 flex items-center gap-2 rounded-sm px-2.5 py-[7px] text-muted-foreground nav-item-hover hover:text-foreground transition-colors"
          >
            <LayoutTemplate className="h-3.5 w-3.5 shrink-0" />
            {t("nav_templates")}
          </button>

          {/* Log Out */}
          {/* Locale toggle */}
          <button
            onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
            className="flex items-center gap-2 rounded-sm px-2.5 py-[7px] text-muted-foreground nav-item-hover hover:text-foreground transition-colors"
          >
            <span className="text-xs font-mono font-semibold">{locale === "pt" ? "EN" : "PT"}</span>
            <span className="text-xs">
              {locale === "pt" ? "Switch to English" : "Mudar para PT"}
            </span>
          </button>

          <button
            onClick={handleSignOut}
            className="mt-auto flex items-center gap-2 rounded-sm px-2.5 py-[7px] text-muted-foreground nav-item-hover hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {t("log_out")}
          </button>
        </nav>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-[52px] items-center gap-2 border-b bg-background px-4 sm:px-5">
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-[360px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full rounded-sm border bg-muted py-1.5 pl-8 pr-12 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-sm border px-1 py-0.5 text-[10px] font-mono text-muted-foreground kbd-badge">
              ⌘K
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {urgentCount > 0 && (
              <Link
                to="/dashboards"
                title={`${urgentCount} ${urgentCount > 1 ? t("urgent_tooltip_many") : t("urgent_tooltip_one")}`}
                className="relative flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground header-icon-hover hover:text-foreground transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white font-mono">
                  {urgentCount > 9 ? "9+" : urgentCount}
                </span>
              </Link>
            )}

            {/* Create */}
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-88 transition-opacity"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">{t("create_btn")}</span>
            </button>

            {/* Theme selector — dropdown com 4 temas (Bloco 3.3) */}
            <div className="relative">
              <button
                onClick={() => setThemeOpen((v) => !v)}
                aria-label={t("toggle_theme")}
                className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground header-icon-hover hover:text-foreground transition-colors"
              >
                <Palette className="h-4 w-4" />
              </button>
              {themeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setThemeOpen(false)} />
                  <div className="absolute right-0 top-9 z-20 min-w-[170px] rounded-lg border bg-card py-1 shadow-lg">
                    {THEMES.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => {
                          setTheme(th.id);
                          setThemePreference(th.id);
                          setThemeOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-border"
                          style={{ backgroundColor: th.swatch }}
                        />
                        <span className="flex-1 text-left">{th.label}</span>
                        {theme === th.id && <Check className="h-3.5 w-3.5 text-foreground" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Avatar */}
            <div className="relative">
              <button
                onClick={() => setAvatarOpen((v) => !v)}
                className="avatar-btn flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-foreground hover:outline hover:outline-2 hover:outline-offset-1 transition-all"
                style={{ fontFamily: "var(--font-display)" }}
                title={user.email}
              >
                {initials(user.email)}
              </button>
              {avatarOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAvatarOpen(false)} />
                  <div className="absolute right-0 top-9 z-20 min-w-[180px] rounded-lg border bg-card py-1 shadow-lg">
                    <div className="border-b px-3 py-2 text-xs text-muted-foreground font-mono">
                      {user.email}
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <User className="h-3.5 w-3.5" />
                      {t("nav_profile")}
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      {t("nav_settings")}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {t("log_out")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {createOpen && <CreateCardModal onClose={() => setCreateOpen(false)} />}
      {templatesOpen && <TemplatesModal onClose={() => setTemplatesOpen(false)} />}
    </div>
  );
}

function AppSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar skeleton */}
      <div className="hidden w-60 shrink-0 flex-col border-r md:flex">
        <div className="flex h-[52px] items-center gap-2 border-b px-4">
          <div className="skeleton-shimmer h-4 w-4 rounded-full" />
          <div className="skeleton-shimmer h-3 w-24 rounded" />
        </div>
        <div className="flex flex-col gap-2 p-3">
          {[100, 80, 90, 70, 85].map((w, i) => (
            <div key={i} className="skeleton-shimmer h-7 rounded-md" style={{ width: `${w}%` }} />
          ))}
          <div className="skeleton-shimmer mt-4 h-3 w-16 rounded" />
          {[90, 75, 80].map((w, i) => (
            <div key={i} className="skeleton-shimmer h-7 rounded-md" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      {/* Main skeleton */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-[52px] items-center gap-2 border-b px-5">
          <div className="skeleton-shimmer h-3 w-32 rounded" />
          <div className="skeleton-shimmer ml-2 h-7 w-64 rounded-md" />
          <div className="skeleton-shimmer ml-auto h-7 w-20 rounded-md" />
          <div className="skeleton-shimmer h-7 w-7 rounded-full" />
        </div>
        <div className="flex flex-col gap-8 p-6 overflow-hidden">
          {[1, 2].map((track) => (
            <div key={track}>
              <div className="skeleton-shimmer mb-4 h-5 w-40 rounded" />
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3].map((col) => (
                  <div key={col} className="flex w-64 shrink-0 flex-col gap-2">
                    <div className="skeleton-shimmer h-3 w-20 rounded" />
                    {[80, 64, 96].slice(0, col === 2 ? 2 : 3).map((h, i) => (
                      <div
                        key={i}
                        className="skeleton-shimmer rounded-lg"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
