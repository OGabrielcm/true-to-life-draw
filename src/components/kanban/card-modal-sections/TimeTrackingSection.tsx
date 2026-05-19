import { useMemo, useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { formatDate, formatMinutes } from "@/lib/kanban-types";
import { useKanban } from "@/lib/kanban-store";
import { useLocale } from "@/lib/locale-context";

export function TimeTrackingSection({ cardId }: { cardId: string }) {
  const { timeLogsByCard, addTimeLog, deleteTimeLog } = useKanban();
  const { t } = useLocale();
  const logs = timeLogsByCard[cardId] ?? [];
  const [adding, setAdding] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const total = useMemo(() => logs.reduce((acc, l) => acc + l.minutes, 0), [logs]);

  const submit = () => {
    const h = parseInt(hours || "0", 10);
    const m = parseInt(minutes || "0", 10);
    const totalMin = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    if (totalMin <= 0) return;
    addTimeLog(cardId, totalMin, note || undefined, date);
    setHours("");
    setMinutes("");
    setNote("");
    setAdding(false);
  };

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="h-3 w-3" />
          {t("time_tracking")} {logs.length > 0 && `(${logs.length})`}
        </p>
        {total > 0 && (
          <span className="text-xs font-semibold text-foreground">{formatMinutes(total)}</span>
        )}
      </div>

      <div className="space-y-1">
        {logs.map((l) => (
          <div
            key={l.id}
            className="group flex items-center gap-2 rounded-md border bg-background px-2 py-1.5"
          >
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
              {formatMinutes(l.minutes)}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatDate(l.logged_at)}
            </span>
            {l.note && <span className="flex-1 truncate text-xs text-foreground/80">{l.note}</span>}
            <button
              onClick={() => deleteTimeLog(l.id, cardId)}
              className="ml-auto opacity-0 group-hover:opacity-100 rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          {t("log_time")}
        </button>
      ) : (
        <div className="mt-2 rounded-md border bg-background p-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="number"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="h"
              className="w-14 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
            />
            <span className="text-xs text-muted-foreground">h</span>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="m"
              className="w-14 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
            />
            <span className="text-xs text-muted-foreground">m</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-xs outline-none focus:border-foreground/40"
            />
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("note_optional")}
            className="mt-1.5 w-full rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
          />
          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              onClick={submit}
              className="rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background hover:opacity-90"
            >
              {t("save")}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setHours("");
                setMinutes("");
                setNote("");
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
