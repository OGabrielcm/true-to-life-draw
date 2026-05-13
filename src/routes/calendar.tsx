import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useKanban } from "@/lib/kanban-store";
import { CardDetailModal } from "@/components/kanban/CardDetailModal";
import { Card, isArchived, getDeadlineStatus, PRIO_COLORS, formatDate } from "@/lib/kanban-types";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
  head: () => ({ meta: [{ title: "Calendário — Molas" }] }),
});

type ViewMode = "month" | "week" | "list";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Parse "YYYY-MM-DD" como data local (evita timezone)
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(d.getDate() - d.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(d.getMonth() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function CalendarPage() {
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
  } = useKanban();
  const { theme } = useTheme();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Apenas cards com prazo e não arquivados
  const datedCards = useMemo(() => cards.filter((c) => c.date && !isArchived(c)), [cards]);

  // Index: ISO date → cards naquele dia
  const cardsByDate = useMemo(() => {
    const m = new Map<string, Card[]>();
    for (const c of datedCards) {
      if (!c.date) continue;
      const list = m.get(c.date) ?? [];
      list.push(c);
      m.set(c.date, list);
    }
    return m;
  }, [datedCards]);

  const open = openId ? (cards.find((c) => c.id === openId) ?? null) : null;

  const goPrev = () => setCursor((c) => (view === "month" ? addMonths(c, -1) : addDays(c, -7)));
  const goNext = () => setCursor((c) => (view === "month" ? addMonths(c, 1) : addDays(c, 7)));
  const goToday = () => setCursor(today);

  const headerLabel =
    view === "month"
      ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
      : view === "week"
        ? (() => {
            const wkStart = startOfWeek(cursor);
            const wkEnd = addDays(wkStart, 6);
            return `${wkStart.getDate()} ${MONTHS[wkStart.getMonth()].slice(0, 3)} — ${wkEnd.getDate()} ${MONTHS[wkEnd.getMonth()].slice(0, 3)} ${wkEnd.getFullYear()}`;
          })()
        : "Próximos prazos";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold inline-flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {headerLabel}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View switcher */}
            <div
              className="inline-flex overflow-hidden rounded-md border"
              style={{ borderWidth: "0.5px" }}
            >
              {(["month", "week", "list"] as ViewMode[]).map((v) => {
                const active = view === v;
                const label = v === "month" ? "Mês" : v === "week" ? "Semana" : "Lista";
                return (
                  <button
                    key={v}
                    onClick={() => setView(v)}
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

            {/* Navigation */}
            {view !== "list" && (
              <div className="inline-flex items-center gap-1">
                <button
                  onClick={goPrev}
                  className="rounded-md border bg-background p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  style={{ borderWidth: "0.5px" }}
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={goToday}
                  className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  style={{ borderWidth: "0.5px" }}
                >
                  Hoje
                </button>
                <button
                  onClick={goNext}
                  className="rounded-md border bg-background p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  style={{ borderWidth: "0.5px" }}
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Views */}
        {view === "month" && (
          <MonthView
            cursor={cursor}
            today={today}
            cardsByDate={cardsByDate}
            tracks={tracks}
            theme={theme}
            onOpenCard={(id) => setOpenId(id)}
          />
        )}

        {view === "week" && (
          <WeekView
            cursor={cursor}
            today={today}
            cardsByDate={cardsByDate}
            tracks={tracks}
            theme={theme}
            onOpenCard={(id) => setOpenId(id)}
          />
        )}

        {view === "list" && (
          <ListView
            datedCards={datedCards}
            tracks={tracks}
            theme={theme}
            today={today}
            onOpenCard={(id) => setOpenId(id)}
          />
        )}
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
        />
      )}
    </AppShell>
  );
}

// ── MONTH VIEW ──
function MonthView({
  cursor,
  today,
  cardsByDate,
  tracks,
  theme,
  onOpenCard,
}: {
  cursor: Date;
  today: Date;
  cardsByDate: Map<string, Card[]>;
  tracks: { id: string; border: string }[];
  theme: string;
  onOpenCard: (id: string) => void;
}) {
  // Grade do mês começando no domingo da primeira semana
  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));

  // Se a última linha estiver totalmente fora do mês, removemos (mês com 4-5 linhas)
  const lastWeekStart = days[35];
  const lastWeekFullyOutside = lastWeekStart.getMonth() !== cursor.getMonth();
  const visibleDays = lastWeekFullyOutside ? days.slice(0, 35) : days;

  return (
    <div className="rounded-xl border bg-background" style={{ borderWidth: "0.5px" }}>
      {/* Header dias da semana */}
      <div className="grid grid-cols-7 border-b" style={{ borderWidth: "0.5px" }}>
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7" style={{ gridAutoRows: "minmax(90px, 1fr)" }}>
        {visibleDays.map((d) => {
          const iso = toLocalIso(d);
          const dayCards = cardsByDate.get(iso) ?? [];
          const isCurrentMonth = d.getMonth() === cursor.getMonth();
          const isToday = isSameDay(d, today);

          return (
            <div
              key={iso}
              className="border-b border-r p-1.5 last:border-r-0 transition-colors hover:bg-muted/20"
              style={{
                borderWidth: "0.5px",
                opacity: isCurrentMonth ? 1 : 0.4,
                backgroundColor: isToday
                  ? "color-mix(in oklab, var(--foreground) 6%, transparent)"
                  : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium"
                  style={{
                    backgroundColor: isToday ? "var(--foreground)" : undefined,
                    color: isToday ? "var(--background)" : "var(--muted-foreground)",
                  }}
                >
                  {d.getDate()}
                </span>
                {dayCards.length > 3 && (
                  <span className="text-[9px] text-muted-foreground">+{dayCards.length - 3}</span>
                )}
              </div>

              <div className="mt-1 flex flex-col gap-0.5">
                {dayCards.slice(0, 3).map((c) => {
                  const track = tracks.find((t) => t.id === c.track);
                  const status = getDeadlineStatus(c);
                  const isDone = c.col === "done";
                  return (
                    <button
                      key={c.id}
                      onClick={() => onOpenCard(c.id)}
                      className="w-full truncate rounded px-1 py-0.5 text-left text-[10px] transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: isDone
                          ? "color-mix(in oklab, var(--muted-foreground) 20%, transparent)"
                          : status === "overdue"
                            ? "#fee2e2"
                            : status === "today"
                              ? "#ffedd5"
                              : "color-mix(in oklab, var(--foreground) 8%, transparent)",
                        color: isDone
                          ? "var(--muted-foreground)"
                          : status === "overdue"
                            ? "#991b1b"
                            : status === "today"
                              ? "#9a3412"
                              : "var(--foreground)",
                        borderLeft: track ? `2px solid ${track.border}` : undefined,
                        textDecoration: isDone ? "line-through" : undefined,
                      }}
                      title={c.title}
                    >
                      {c.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WEEK VIEW ──
function WeekView({
  cursor,
  today,
  cardsByDate,
  tracks,
  theme,
  onOpenCard,
}: {
  cursor: Date;
  today: Date;
  cardsByDate: Map<string, Card[]>;
  tracks: { id: string; border: string }[];
  theme: string;
  onOpenCard: (id: string) => void;
}) {
  const weekStart = startOfWeek(cursor);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i));

  return (
    <div
      className="rounded-xl border bg-background overflow-x-auto"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="grid grid-cols-7 min-w-[700px]">
        {days.map((d) => {
          const iso = toLocalIso(d);
          const dayCards = cardsByDate.get(iso) ?? [];
          const isToday = isSameDay(d, today);

          return (
            <div
              key={iso}
              className="flex flex-col border-r last:border-r-0"
              style={{ borderWidth: "0.5px", minHeight: "400px" }}
            >
              <div
                className="border-b px-3 py-2"
                style={{
                  borderWidth: "0.5px",
                  backgroundColor: isToday
                    ? "color-mix(in oklab, var(--foreground) 8%, transparent)"
                    : undefined,
                }}
              >
                <div className="text-[10px] font-medium uppercase text-muted-foreground">
                  {WEEKDAYS[d.getDay()]}
                </div>
                <div
                  className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: isToday ? "var(--foreground)" : undefined,
                    color: isToday ? "var(--background)" : "var(--foreground)",
                  }}
                >
                  {d.getDate()}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-1 p-2">
                {dayCards.length === 0 && (
                  <span className="text-[10px] text-muted-foreground/60">—</span>
                )}
                {dayCards.map((c) => {
                  const track = tracks.find((t) => t.id === c.track);
                  const status = getDeadlineStatus(c);
                  const isDone = c.col === "done";
                  const prioRaw = PRIO_COLORS[c.prio];
                  const prio =
                    theme === "dark"
                      ? { bg: prioRaw.darkBg, fg: prioRaw.darkFg }
                      : { bg: prioRaw.bg, fg: prioRaw.fg };

                  return (
                    <button
                      key={c.id}
                      onClick={() => onOpenCard(c.id)}
                      className="w-full rounded-md border bg-card p-2 text-left transition-all hover:border-foreground/30"
                      style={{
                        borderWidth: "0.5px",
                        borderLeft: track ? `3px solid ${track.border}` : undefined,
                        opacity: isDone ? 0.6 : 1,
                      }}
                    >
                      <div
                        className="text-xs font-medium leading-snug"
                        style={{ textDecoration: isDone ? "line-through" : undefined }}
                      >
                        {c.title}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1">
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                          style={{ backgroundColor: prio.bg, color: prio.fg }}
                        >
                          {c.prio}
                        </span>
                        {status === "overdue" && (
                          <span className="text-[9px] font-semibold text-red-600">Vencido</span>
                        )}
                        {status === "today" && (
                          <span className="text-[9px] font-semibold text-orange-600">Hoje</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── LIST VIEW (agenda) ──
function ListView({
  datedCards,
  tracks,
  theme,
  today,
  onOpenCard,
}: {
  datedCards: Card[];
  tracks: { id: string; border: string }[];
  theme: string;
  today: Date;
  onOpenCard: (id: string) => void;
}) {
  // Agrupa por data e ordena cronologicamente
  const grouped = useMemo(() => {
    const m = new Map<string, Card[]>();
    for (const c of datedCards) {
      if (!c.date) continue;
      const list = m.get(c.date) ?? [];
      list.push(c);
      m.set(c.date, list);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [datedCards]);

  if (grouped.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground"
        style={{ borderWidth: "0.5px" }}
      >
        Nenhum card com prazo. Adicione uma data de entrega a um card para vê-lo aqui.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([iso, dayCards]) => {
        const d = parseLocalDate(iso);
        const isToday = isSameDay(d, today);
        const isPast = d.getTime() < today.getTime();
        const weekday = WEEKDAYS[d.getDay()];

        return (
          <div key={iso}>
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full px-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: isToday
                    ? "var(--foreground)"
                    : "color-mix(in oklab, var(--foreground) 8%, transparent)",
                  color: isToday ? "var(--background)" : "var(--foreground)",
                }}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">
                  {weekday}, {formatDate(iso)}
                  {isToday && <span className="ml-1.5 text-orange-600">· Hoje</span>}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {dayCards.length} card{dayCards.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div
              className="rounded-xl border bg-background divide-y"
              style={{ borderWidth: "0.5px" }}
            >
              {dayCards.map((c) => {
                const track = tracks.find((t) => t.id === c.track);
                const status = getDeadlineStatus(c);
                const isDone = c.col === "done";
                const prioRaw = PRIO_COLORS[c.prio];
                const prio =
                  theme === "dark"
                    ? { bg: prioRaw.darkBg, fg: prioRaw.darkFg }
                    : { bg: prioRaw.bg, fg: prioRaw.fg };

                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenCard(c.id)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/40"
                    style={{
                      borderLeft: track ? `3px solid ${track.border}` : undefined,
                      opacity: isDone ? 0.55 : 1,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="truncate text-sm font-medium text-foreground"
                        style={{ textDecoration: isDone ? "line-through" : undefined }}
                      >
                        {c.title}
                      </div>
                      {c.desc && (
                        <div className="truncate text-xs text-muted-foreground">{c.desc}</div>
                      )}
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
                      style={{ backgroundColor: prio.bg, color: prio.fg }}
                    >
                      {c.prio}
                    </span>
                    {!isDone && status === "overdue" && (
                      <span className="text-[10px] font-semibold text-red-600 shrink-0">
                        Vencido
                      </span>
                    )}
                    {!isDone && status === "today" && (
                      <span className="text-[10px] font-semibold text-orange-600 shrink-0">
                        Hoje
                      </span>
                    )}
                    {!isDone && isPast && status !== "overdue" && (
                      <span className="text-[10px] text-muted-foreground shrink-0">passado</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
