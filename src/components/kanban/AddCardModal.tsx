import { useEffect, useState } from "react";
import { Star, LayoutTemplate } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { MarkdownEditor } from "./MarkdownEditor";
import {
  Column,
  ColumnId,
  Priority,
  PRIORITIES,
  Trilha,
  Card,
  CardTemplate,
  Track,
  TrackId,
  TaskType,
} from "@/lib/kanban-types";

export interface AddCardSubmit {
  col: ColumnId;
  track: TrackId;
  type: TaskType;
  parent_id?: string;
  title: string;
  desc?: string;
  prio: Priority;
  date?: string;
  starred: boolean;
  tags: string[];
}

export function AddCardModal({
  column,
  track,
  tracks,
  columns,
  trilhas,
  goals,
  templates = [],
  allowTrackPick = false,
  allowColPick = false,
  onClose,
  onAdd,
}: {
  column: ColumnId;
  track: TrackId;
  tracks: Track[];
  columns: Column[];
  trilhas: Trilha[];
  goals: Card[];
  templates?: CardTemplate[];
  allowTrackPick?: boolean;
  allowColPick?: boolean;
  onClose: () => void;
  onAdd: (card: AddCardSubmit) => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [prio, setPrio] = useState<Priority>("Média");
  const [date, setDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [type, setType] = useState<TaskType>("Task");
  const [trackSel, setTrackSel] = useState<TrackId>(track);
  const [colSel, setColSel] = useState<ColumnId>(column);
  const [parentId, setParentId] = useState<string>("");
  const [starred, setStarred] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { t } = useLocale();

  const applyTemplate = (tpl: CardTemplate) => {
    setType(tpl.type);
    setPrio(tpl.prio);
    setDesc(tpl.desc ?? "");
    setTags(tpl.tags);
    setShowTemplates(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const availableGoals = goals.filter((g) => g.track === trackSel);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      col: colSel,
      track: trackSel,
      type,
      parent_id: type === "Task" && parentId ? parentId : undefined,
      title: title.trim(),
      desc: desc.trim() || undefined,
      prio,
      date: date || undefined,
      starred,
      tags,
    });
    onClose();
  };

  const toggleTag = (id: string) =>
    setTags((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-xl bg-card p-5 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">{t("add_card")}</h2>
          <div className="flex items-center gap-2">
            {templates.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTemplates((v) => !v)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  title={t("use_template")}
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  {t("template")}
                </button>
                {showTemplates && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
                    <div
                      className="absolute right-0 top-8 z-20 w-56 rounded-lg border bg-background py-1 shadow-md"
                      style={{ borderWidth: "0.5px" }}
                    >
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyTemplate(tpl)}
                          className="flex w-full flex-col px-3 py-2 text-left hover:bg-muted"
                        >
                          <span className="text-xs font-medium text-foreground">{tpl.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {tpl.type} · {tpl.prio}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setStarred((s) => !s)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={t("favorite")}
            >
              <Star className="h-4 w-4" fill={starred ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("title")}</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("description")}</label>
            <div className="mt-1">
              <MarkdownEditor
                value={desc}
                onChange={setDesc}
                placeholder={t("desc_optional")}
                minHeight="7rem"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("type")}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                style={{ borderWidth: "0.5px" }}
              >
                <option value="Task">{t("task")}</option>
                <option value="Goal">{t("goal")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("priority")}</label>
              <select
                value={prio}
                onChange={(e) => setPrio(e.target.value as Priority)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                style={{ borderWidth: "0.5px" }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(allowTrackPick || allowColPick) && (
            <div className="grid grid-cols-2 gap-3">
              {allowTrackPick && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("tracks")}</label>
                  <select
                    value={trackSel}
                    onChange={(e) => {
                      setTrackSel(e.target.value as TrackId);
                      setParentId("");
                    }}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                    style={{ borderWidth: "0.5px" }}
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {allowColPick && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("column")}</label>
                  <select
                    value={colSel}
                    onChange={(e) => setColSel(e.target.value as ColumnId)}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                    style={{ borderWidth: "0.5px" }}
                  >
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("deadline")}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
          {type === "Task" && availableGoals.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t("goal_parent")}
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                style={{ borderWidth: "0.5px" }}
              >
                <option value="">{t("no_parent")}</option>
                {availableGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("tags")}</label>
            {trilhas.length === 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">{t("no_tags")}</p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {trilhas.map((t) => {
                  const active = tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className="rounded-full px-2.5 py-1 text-xs font-medium transition-opacity"
                      style={{
                        backgroundColor: active ? t.bg : "transparent",
                        color: active ? t.fg : "var(--muted-foreground)",
                        border: `0.5px solid ${active ? t.bg : "var(--border)"}`,
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            {t("create")}
          </button>
        </div>
      </form>
    </div>
  );
}
