import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Archive, Search, Trash2, Download, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useKanban } from "@/lib/kanban-store";
import { formatDate, getDeadlineStatus, isArchived } from "@/lib/kanban-types";
import { exportToCSV, exportToPDF } from "@/lib/dashboard-export";
import { CardDetailModal } from "@/components/kanban/CardDetailModal";
import { useTheme } from "@/components/theme-provider";
import { useLocale } from "@/lib/locale-context";
import { DashboardHabits } from "@/components/habits/DashboardHabits";

type ArchiveFilter = "all" | "active" | "archived";
type DeadlineFilter = "all" | "overdue" | "today" | "this_week";
type PriorityFilter = "all" | "Alta" | "Média" | "Baixa";
type CardTypeFilter = "all" | "task" | "goal";

export const Route = createFileRoute("/dashboards")({
  component: DashboardsPage,
  head: () => ({ meta: [{ title: "Dashboards — Molas" }] }),
});

function DashboardsPage() {
  const {
    cards,
    trilhas,
    tracks,
    columns,
    updateCard,
    moveCard,
    deleteCard,
    toggleStar,
    duplicateCard,
    saveTemplate,
    cardColors,
    setCardColor,
  } = useKanban();
  const { theme } = useTheme();
  const { t, locale } = useLocale();
  const [q, setQ] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("all");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [cardTypeFilter, setCardTypeFilter] = useState<CardTypeFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const getDateDiff = (dateStr: string | null) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cardDate = new Date(dateStr);
    cardDate.setHours(0, 0, 0, 0);
    return Math.floor((cardDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const rows = useMemo(() => {
    const isGoal = (cardId: string) =>
      cards.find((c) => c.id === cardId)?.parent_id === null &&
      cards.some((c) => c.parent_id === cardId);

    const query = q.trim().toLowerCase();
    return [...cards]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .filter((c) => {
        const archived = isArchived(c);
        if (archiveFilter === "active" && archived) return false;
        if (archiveFilter === "archived" && !archived) return false;
        if (
          query &&
          !c.title.toLowerCase().includes(query) &&
          !(c.desc ?? "").toLowerCase().includes(query)
        )
          return false;

        if (deadlineFilter !== "all") {
          const status = getDeadlineStatus(c);
          if (deadlineFilter === "overdue" && status !== "overdue") return false;
          if (deadlineFilter === "today" && status !== "today") return false;
          if (deadlineFilter === "this_week") {
            const diff = getDateDiff(c.date ?? null);
            if (diff === null || diff < 0 || diff > 6) return false;
          }
        }

        if (priorityFilter !== "all" && c.prio !== priorityFilter) return false;

        if (cardTypeFilter !== "all") {
          const isCardGoal = isGoal(c.id);
          if (cardTypeFilter === "task" && isCardGoal) return false;
          if (cardTypeFilter === "goal" && !isCardGoal) return false;
        }

        return true;
      });
  }, [cards, q, archiveFilter, deadlineFilter, priorityFilter, cardTypeFilter]);

  const archivedCount = useMemo(() => cards.filter(isArchived).length, [cards]);

  // ── Estatísticas ──
  const stats = useMemo(() => {
    const active = cards.filter((c) => !isArchived(c));
    const total = active.length;
    const done = active.filter((c) => c.col === "done").length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    const overdue = active.filter((c) => getDeadlineStatus(c) === "overdue").length;
    const today = active.filter((c) => getDeadlineStatus(c) === "today").length;

    // Por coluna
    const byColumn = columns.map((col) => ({
      col,
      count: active.filter((c) => c.col === col.id).length,
    }));

    // Por prioridade
    const alta = active.filter((c) => c.prio === "Alta").length;
    const media = active.filter((c) => c.prio === "Média").length;
    const baixa = active.filter((c) => c.prio === "Baixa").length;

    // Por track
    const byTrack = tracks.map((t) => ({
      track: t,
      count: active.filter((c) => c.track === t.id).length,
    }));

    return { total, done, completionRate, overdue, today, byColumn, alta, media, baixa, byTrack };
  }, [cards, columns, tracks]);

  const open = openId ? (cards.find((c) => c.id === openId) ?? null) : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        {/* ── ESTATÍSTICAS ── */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">{t("statistics")}</h2>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-4" style={{ borderWidth: "0.5px" }}>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{t("active_cards")}</div>
            </div>
            <div className="rounded-xl border bg-card p-4" style={{ borderWidth: "0.5px" }}>
              <div className="text-2xl font-bold text-foreground">{stats.completionRate}%</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{t("completion_rate")}</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
            <div
              className="rounded-xl border bg-card p-4"
              style={{ borderWidth: "0.5px", borderLeftWidth: "3px", borderLeftColor: "#ef4444" }}
            >
              <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{t("overdue_cards")}</div>
            </div>
            <div
              className="rounded-xl border bg-card p-4"
              style={{ borderWidth: "0.5px", borderLeftWidth: "3px", borderLeftColor: "#f97316" }}
            >
              <div className="text-2xl font-bold text-orange-500">{stats.today}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{t("due_today")}</div>
            </div>
          </div>

          {/* Gráficos de barras */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Por coluna */}
            <div className="rounded-xl border bg-card p-4" style={{ borderWidth: "0.5px" }}>
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                {t("cards_by_column")}
              </p>
              <div className="space-y-2">
                {stats.byColumn.map(({ col, count }) => {
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={col.id}>
                      <div className="mb-0.5 flex items-center justify-between text-[11px]">
                        <span className="text-foreground">{col.name}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground/60 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Por prioridade */}
            <div className="rounded-xl border bg-card p-4" style={{ borderWidth: "0.5px" }}>
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                {t("cards_by_priority")}
              </p>
              <div className="space-y-2">
                {[
                  {
                    label: "Alta",
                    count: stats.alta,
                    color: theme === "dark" ? "#F09595" : "#791F1F",
                    bg: theme === "dark" ? "#501313" : "#FCEBEB",
                  },
                  {
                    label: "Média",
                    count: stats.media,
                    color: theme === "dark" ? "#FAC775" : "#633806",
                    bg: theme === "dark" ? "#412402" : "#FAEEDA",
                  },
                  {
                    label: "Baixa",
                    count: stats.baixa,
                    color: theme === "dark" ? "#97C459" : "#27500A",
                    bg: theme === "dark" ? "#173404" : "#EAF3DE",
                  },
                ].map(({ label, count, color, bg }) => {
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={label}>
                      <div className="mb-0.5 flex items-center justify-between text-[11px]">
                        <span
                          className="rounded-full px-1.5 py-0.5 font-medium"
                          style={{ backgroundColor: bg, color }}
                        >
                          {label}
                        </span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Por track */}
            <div className="rounded-xl border bg-card p-4" style={{ borderWidth: "0.5px" }}>
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                {t("cards_by_track")}
              </p>
              <div className="space-y-2">
                {stats.byTrack.map(({ track, count }) => {
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={track.id}>
                      <div className="mb-0.5 flex items-center justify-between text-[11px]">
                        <span className="text-foreground">{track.name}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: track.border }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── HÁBITOS (Bloco 7.1) ── */}
        <DashboardHabits />

        {/* ── TABELA ── */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">{t("all_cards")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                style={{ borderWidth: "0.5px" }}
              >
                <ChevronDown
                  className="h-3.5 w-3.5 transition-transform"
                  style={{ transform: showAdvancedFilters ? "rotate(0)" : "rotate(-90deg)" }}
                />
                {t("filters")}
              </button>
              <div className="relative">
                <button
                  onClick={() => setExportOpen(!exportOpen)}
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  style={{ borderWidth: "0.5px" }}
                  title={t("export_data")}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("export")}</span>
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                    <div
                      className="absolute right-0 top-9 z-20 rounded-md border bg-background py-1 shadow-md"
                      style={{ borderWidth: "0.5px" }}
                    >
                      <button
                        onClick={() => {
                          exportToCSV(rows, tracks, columns);
                          setExportOpen(false);
                        }}
                        className="block w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => {
                          exportToPDF(rows, tracks, columns);
                          setExportOpen(false);
                        }}
                        className="block w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                      >
                        PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div
              className="rounded-lg border bg-card p-3 space-y-3"
              style={{ borderWidth: "0.5px" }}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("status")}
                  </label>
                  <div
                    className="inline-flex overflow-hidden rounded-md border"
                    style={{ borderWidth: "0.5px" }}
                  >
                    {(["all", "active", "archived"] as ArchiveFilter[]).map((opt) => {
                      const active = archiveFilter === opt;
                      const label =
                        opt === "all"
                          ? t("status_all")
                          : opt === "active"
                            ? t("status_active")
                            : t("status_archived");
                      return (
                        <button
                          key={opt}
                          onClick={() => setArchiveFilter(opt)}
                          className="whitespace-nowrap px-2 py-1 text-[10px] font-medium transition-colors"
                          style={{
                            backgroundColor: active ? "var(--foreground)" : "transparent",
                            color: active ? "var(--background)" : "var(--muted-foreground)",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("deadline_filter")}
                  </label>
                  <select
                    value={deadlineFilter}
                    onChange={(e) => setDeadlineFilter(e.target.value as DeadlineFilter)}
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:border-foreground/40"
                    style={{ borderWidth: "0.5px" }}
                  >
                    <option value="all">{t("status_all")}</option>
                    <option value="overdue">{t("deadline_overdue")}</option>
                    <option value="today">{t("deadline_today")}</option>
                    <option value="this_week">{t("deadline_week")}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("priority")}
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:border-foreground/40"
                    style={{ borderWidth: "0.5px" }}
                  >
                    <option value="all">{t("priority_all")}</option>
                    <option value="Alta">{t("prio_high")}</option>
                    <option value="Média">{t("prio_medium")}</option>
                    <option value="Baixa">{t("prio_low")}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("type_filter")}
                  </label>
                  <select
                    value={cardTypeFilter}
                    onChange={(e) => setCardTypeFilter(e.target.value as CardTypeFilter)}
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:border-foreground/40"
                    style={{ borderWidth: "0.5px" }}
                  >
                    <option value="all">{t("type_all")}</option>
                    <option value="task">{t("type_tasks")}</option>
                    <option value="goal">{t("type_goals")}</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("search_cards_placeholder")}
                  className="w-full rounded-md border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-foreground/40"
                  style={{ borderWidth: "0.5px" }}
                />
              </div>
            </div>
          )}

          {!showAdvancedFilters && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="inline-flex overflow-hidden rounded-md border"
                  style={{ borderWidth: "0.5px" }}
                >
                  {(["all", "active", "archived"] as ArchiveFilter[]).map((opt) => {
                    const active = archiveFilter === opt;
                    const label =
                      opt === "all"
                        ? t("status_all")
                        : opt === "active"
                          ? t("status_active")
                          : `${t("status_archived")}${archivedCount > 0 ? ` (${archivedCount})` : ""}`;
                    return (
                      <button
                        key={opt}
                        onClick={() => setArchiveFilter(opt)}
                        className="whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: active ? "var(--foreground)" : "transparent",
                          color: active ? "var(--background)" : "var(--muted-foreground)",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("search")}
                  className="w-full rounded-md border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-foreground/40 sm:w-52"
                  style={{ borderWidth: "0.5px" }}
                />
              </div>
            </div>
          )}
        </div>
        {/* Wrapper relativo: a tabela rola na horizontal no mobile (não cabe em
            390/375px). O degradê na borda direita sinaliza que há mais colunas
            (ações inclusive) ao rolar — some no desktop (md:), onde tudo cabe. */}
        <div className="relative">
          <div className="overflow-x-auto rounded-xl border" style={{ borderWidth: "0.5px" }}>
            <table className="min-w-[680px] w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {t("col_header_title")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {t("col_header_track")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {t("col_header_status")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {t("col_header_priority")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {t("col_header_deadline")}
                  </th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {t("col_header_updated")}
                  </th>
                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">
                    {t("col_header_actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const track = tracks.find((t) => t.id === c.track);
                  const col = columns.find((x) => x.id === c.col);
                  const archived = isArchived(c);
                  return (
                    <tr
                      key={c.id}
                      className="border-t"
                      style={{ borderWidth: "0.5px", opacity: archived ? 0.7 : 1 }}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOpenId(c.id)}
                            className="text-left font-medium text-foreground hover:underline"
                          >
                            {c.title}
                          </button>
                          {archived && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              <Archive className="h-2.5 w-2.5" />
                              {t("archived_badge")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: track?.bg, color: track?.fg }}
                        >
                          {track?.name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{col?.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.prio}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(c.date)}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {new Date(c.updated_at).toLocaleDateString(
                          locale === "pt" ? "pt-BR" : "en-US",
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => setOpenId(c.id)}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`${t("delete_confirm")}`)) deleteCard(c.id);
                          }}
                          className="ml-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          aria-label={t("delete")}
                        >
                          <Trash2 className="inline h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                      {t("no_cards")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Affordance de scroll horizontal (só mobile): degradê na borda
              direita indicando colunas escondidas. Não captura toque. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-xl bg-gradient-to-l from-background to-transparent md:hidden"
          />
        </div>
      </div>
      {open && (
        <CardDetailModal
          card={open}
          allCards={cards}
          tracks={tracks}
          columns={columns}
          trilhas={trilhas}
          onClose={() => setOpenId(null)}
          onMove={moveCard}
          onDelete={deleteCard}
          onToggleStar={toggleStar}
          onUpdate={updateCard}
          onDuplicate={duplicateCard}
          onSaveTemplate={saveTemplate}
          onSetCardColor={setCardColor}
          cardColor={cardColors[open?.id ?? ""]}
        />
      )}
    </AppShell>
  );
}
