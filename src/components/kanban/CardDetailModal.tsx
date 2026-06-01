import { useEffect, useState } from "react";
import {
  Calendar,
  Pencil,
  Star,
  Trash2,
  Target,
  Check,
  X,
  Copy,
  LayoutTemplate,
  Activity as ActivityIcon,
  MessageSquare,
  Clock,
} from "lucide-react";
import {
  Card,
  ChecklistItem,
  Column,
  ColumnId,
  PRIORITIES,
  PRIO_COLORS,
  Track,
  TrackId,
  Trilha,
  formatDate,
  getDeadlineStatus,
  getGoalProgress,
  getChecklistProgress,
} from "@/lib/kanban-types";

function getDeadlineColor(status: ReturnType<typeof getDeadlineStatus>): string {
  if (status === "overdue") return "var(--color-destructive)";
  if (status === "today") return "rgb(249 115 22)"; // orange-500
  if (status === "soon") return "rgb(234 179 8)"; // yellow-500
  return "var(--muted-foreground)";
}
import { useTheme } from "@/components/theme-provider";
import { useLocale } from "@/lib/locale-context";
import { renderMarkdown } from "@/lib/markdown";
import { CARD_COLOR_PRESETS } from "@/lib/kanban-types";
import { useKanban } from "@/lib/kanban-store";
import { ChecklistSection } from "./card-modal-sections/ChecklistSection";
import { CommentsSection } from "./card-modal-sections/CommentsSection";
import { TimeTrackingSection } from "./card-modal-sections/TimeTrackingSection";
import { ActivitySection } from "./card-modal-sections/ActivitySection";
import { DependenciesSection } from "./card-modal-sections/DependenciesSection";
import { AttachmentsSection } from "./card-modal-sections/AttachmentsSection";

export function CardDetailModal({
  card,
  allCards,
  tracks,
  columns,
  trilhas,
  onClose,
  onMove,
  onDelete,
  onToggleStar,
  onUpdate,
  onDuplicate,
  onSaveTemplate,
  onSetCardColor,
  cardColor,
}: {
  card: Card;
  allCards: Card[];
  tracks: Track[];
  columns: Column[];
  trilhas: Trilha[];
  onClose: () => void;
  onMove: (id: string, col: ColumnId, track?: TrackId) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Card>) => void;
  onDuplicate?: (id: string) => void;
  onSaveTemplate?: (card: Card, name: string) => void;
  onSetCardColor?: (cardId: string, color: string) => void;
  cardColor?: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [colorOpen, setColorOpen] = useState(false);
  const { theme } = useTheme();
  const { t } = useLocale();
  const { loadCardDetails, commentsByCard, activitiesByCard, timeLogsByCard, attachmentsByCard } =
    useKanban();

  // Contadores reais por aba (3.1): exibem QUANTOS itens cada aba tem.
  // (Os números 1-5 ao lado do nome são atalhos de teclado, não contagem.)
  const checklistProg = getChecklistProgress(card);
  const tabCounts: Record<string, string | null> = {
    detalhes: null,
    checklist: checklistProg.total > 0 ? `${checklistProg.done}/${checklistProg.total}` : null,
    comentarios:
      (commentsByCard[card.id]?.length ?? 0) > 0 ? String(commentsByCard[card.id].length) : null,
    atividade:
      (activitiesByCard[card.id]?.length ?? 0) > 0
        ? String(activitiesByCard[card.id].length)
        : null,
    tempo:
      (timeLogsByCard[card.id]?.length ?? 0) > 0 ? String(timeLogsByCard[card.id].length) : null,
    anexos:
      (attachmentsByCard[card.id]?.length ?? 0) > 0
        ? String(attachmentsByCard[card.id].length)
        : null,
  };

  // Tabs — persiste a aba ativa no localStorage
  type TabId = "detalhes" | "checklist" | "comentarios" | "atividade" | "tempo" | "anexos";
  const TABS: { id: TabId; label: string; shortcut: string }[] = [
    { id: "detalhes", label: t("tab_details"), shortcut: "1" },
    { id: "checklist", label: t("tab_checklist"), shortcut: "2" },
    { id: "comentarios", label: t("tab_comments"), shortcut: "3" },
    { id: "atividade", label: t("tab_activity"), shortcut: "4" },
    { id: "tempo", label: t("tab_time"), shortcut: "5" },
    { id: "anexos", label: t("tab_attachments"), shortcut: "6" },
  ];
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem("molas-modal-tab") as TabId | null;
    return saved && TABS.some((t) => t.id === saved) ? saved : "detalhes";
  });
  const switchTab = (id: TabId) => {
    setActiveTab(id);
    localStorage.setItem("molas-modal-tab", id);
  };

  useEffect(() => {
    loadCardDetails(card.id);
  }, [card.id, loadCardDetails]);

  // Edit state
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.desc ?? "");
  const [editPrio, setEditPrio] = useState(card.prio);
  const [editDate, setEditDate] = useState(card.date ?? "");
  const [editTags, setEditTags] = useState<string[]>(card.tags);

  // Sync when card changes externally (e.g. optimistic update)
  useEffect(() => {
    if (!editing) {
      setEditTitle(card.title);
      setEditDesc(card.desc ?? "");
      setEditPrio(card.prio);
      setEditDate(card.date ?? "");
      setEditTags(card.tags);
    }
  }, [card, editing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) {
          setEditing(false);
          return;
        }
        onClose();
      }
      if (e.key === "e" && !editing && !savingTemplate) {
        e.preventDefault();
        setEditing(true);
      }
      if (e.key === "d" && !editing && !savingTemplate) {
        e.preventDefault();
        setConfirm(true);
      }
      // Atalhos 1–5 para trocar de tab
      const idx = parseInt(e.key) - 1;
      if (!editing && idx >= 0 && idx < TABS.length) {
        e.preventDefault();
        switchTab(TABS[idx].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editing, savingTemplate]);

  const saveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdate(card.id, {
      title: editTitle.trim(),
      desc: editDesc.trim() || undefined,
      prio: editPrio,
      date: editDate || undefined,
      tags: editTags,
    });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(card.title);
    setEditDesc(card.desc ?? "");
    setEditPrio(card.prio);
    setEditDate(card.date ?? "");
    setEditTags(card.tags);
    setEditing(false);
  };

  const toggleTag = (id: string) =>
    setEditTags((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const prioRaw = PRIO_COLORS[editing ? editPrio : card.prio];
  const prio =
    theme === "dark"
      ? { bg: prioRaw.darkBg, fg: prioRaw.darkFg }
      : { bg: prioRaw.bg, fg: prioRaw.fg };
  const parent = card.parent_id ? allCards.find((c) => c.id === card.parent_id) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-foreground/20 backdrop-blur-sm"
      onClick={editing ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-enter w-full max-w-2xl rounded-xl bg-card shadow-2xl max-h-[88vh] flex flex-col overflow-hidden border border-border"
      >
        {/* ── TOPO: eyebrow + título + ações ── */}
        <div className="p-5 pb-0 flex-shrink-0">
          {/* Eyebrow: track + tipo + badges */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2 font-mono uppercase tracking-widest">
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
              style={{ backgroundColor: prio.bg, color: prio.fg }}
            >
              {card.prio}
            </span>
            <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5">
              {card.type === "Goal" && <Target className="h-3 w-3" />}
              {card.type}
            </span>
            {card.date && (
              <span
                className="inline-flex items-center gap-1"
                style={{ color: getDeadlineColor(getDeadlineStatus(card)) }}
              >
                <Calendar className="h-3 w-3" />
                {formatDate(card.date)}
              </span>
            )}
            {card.tags.map((tid) => {
              const t = trilhas.find((x) => x.id === tid);
              if (!t) return null;
              return (
                <span
                  key={tid}
                  className="rounded-full px-1.5 py-0.5"
                  style={{ backgroundColor: t.bg, color: t.fg }}
                >
                  {t.name}
                </span>
              );
            })}
            {/* Ações no canto direito */}
            <div className="ml-auto flex items-center gap-0.5">
              {!editing && onSetCardColor && (
                <div className="relative">
                  <button
                    onClick={() => setColorOpen(!colorOpen)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={t("highlight_color")}
                  >
                    <div
                      className="h-3 w-3 rounded"
                      style={{
                        backgroundColor:
                          cardColor && cardColor !== "none" ? cardColor : "var(--muted-foreground)",
                      }}
                    />
                  </button>
                  {colorOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setColorOpen(false)} />
                      <div className="absolute right-0 top-8 z-20 grid w-48 grid-cols-4 gap-1 rounded-lg border bg-background p-2 shadow-md">
                        {CARD_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              onSetCardColor(card.id, preset.name);
                              setColorOpen(false);
                            }}
                            className="h-6 w-6 rounded transition-transform hover:scale-110"
                            style={{
                              backgroundColor: preset.bg,
                              border:
                                preset.bg === "transparent"
                                  ? "1px dashed var(--border)"
                                  : undefined,
                            }}
                            title={preset.label}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {!editing && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={t("edit")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {onDuplicate && (
                    <button
                      onClick={() => {
                        onDuplicate(card.id);
                        onClose();
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t("duplicate")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => onToggleStar(card.id)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={t("favorite")}
              >
                <Star
                  className={`h-4 w-4 ${card.starred ? "text-yellow-500" : ""}`}
                  fill={card.starred ? "currentColor" : "none"}
                />
              </button>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Título */}
          {!editing ? (
            <h2
              className="text-xl font-semibold text-card-foreground leading-snug"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}
            >
              {card.title}
            </h2>
          ) : (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-lg font-medium outline-none focus:border-foreground/40"
              autoFocus
            />
          )}

          {parent && (
            <div className="mt-1 text-xs text-muted-foreground">
              {t("goal_parent_label")} <span className="text-foreground">{parent.title}</span>
            </div>
          )}

          {/* Tabs — só no modo view */}
          {!editing && (
            <div className="mt-4 flex gap-0 border-b -mx-5 px-5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap border-b-2 -mb-px uppercase tracking-wider ${
                    activeTab === tab.id
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground"
                  }`}
                  style={{ fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}
                >
                  <span className="mr-1 opacity-30 text-[9px] font-mono">{tab.shortcut}</span>
                  {tab.label}
                  {tabCounts[tab.id] && (
                    <span
                      className={`ml-1.5 inline-flex items-center rounded-full px-1.5 text-[9px] font-mono tabular-nums ${
                        activeTab === tab.id
                          ? "bg-foreground/15 text-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tabCounts[tab.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── CORPO COM SCROLL ── */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Modo edição — mostra tudo inline */}
          {editing && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <select
                    value={editPrio}
                    onChange={(e) => setEditPrio(e.target.value as Card["prio"])}
                    className="rounded border bg-background px-2 py-1 text-xs outline-none"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="rounded border bg-background px-2 py-1 text-xs outline-none"
                    />
                    {editDate && (
                      <button
                        onClick={() => setEditDate("")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trilhas.map((t) => {
                    const active = editTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.id)}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity"
                        style={{
                          backgroundColor: active ? t.bg : "transparent",
                          color: active ? t.fg : "var(--muted-foreground)",
                          border: `1px solid ${active ? t.bg : "var(--border)"}`,
                        }}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={5}
                  placeholder={t("desc_optional")}
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={saveEdit}
                  className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
                >
                  <Check className="h-3.5 w-3.5" />
                  {t("save")}
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  {t("cancel")}
                </button>
              </div>
            </>
          )}

          {/* Tab: Detalhes */}
          {!editing && activeTab === "detalhes" && (
            <div>
              {card.type === "Goal" &&
                (() => {
                  const progress = getGoalProgress(card, allCards);
                  return (
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t("progress")}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {progress.percent}%
                        </span>
                      </div>
                      <div className="h-[3px] w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground transition-all duration-300"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {progress.done} / {progress.total} {t("tasks_done")}
                      </div>
                    </div>
                  );
                })()}
              {card.desc ? (
                <div
                  className="mb-5 text-sm text-card-foreground/80 prose prose-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(card.desc) }}
                />
              ) : (
                <p className="mb-5 text-xs text-muted-foreground italic">
                  {t("no_desc")} <kbd className="rounded border px-1 py-0.5 text-[10px]">e</kbd>{" "}
                  {t("no_desc_hint")}
                </p>
              )}
              {/* Mover coluna/track */}
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {t("move_to_column")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {columns
                      .filter((c) => c.id !== card.col)
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onMove(card.id, c.id);
                            onClose();
                          }}
                          className="rounded-sm border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          {c.name}
                        </button>
                      ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {t("move_to_track")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tracks
                      .filter((t) => t.id !== card.track)
                      .map((t) => {
                        const bg = theme === "dark" ? t.darkBg : t.bg;
                        const fg = theme === "dark" ? t.darkFg : t.fg;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              onMove(card.id, card.col, t.id);
                              onClose();
                            }}
                            className="rounded-sm px-2.5 py-1 text-xs font-medium hover:opacity-80"
                            style={{
                              backgroundColor: bg,
                              color: fg,
                              border: `1px solid ${t.border}`,
                            }}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                  </div>
                </div>
                {/* Template + Excluir */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                  {onSaveTemplate && !savingTemplate && (
                    <button
                      onClick={() => {
                        setSavingTemplate(true);
                        setTemplateName(card.title);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <LayoutTemplate className="h-3.5 w-3.5" />
                      {t("save_as_template")}
                    </button>
                  )}
                  {savingTemplate && (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setSavingTemplate(false);
                          if (e.key === "Enter" && templateName.trim()) {
                            onSaveTemplate!(card, templateName.trim());
                            setSavingTemplate(false);
                          }
                        }}
                        placeholder={t("template_name_placeholder")}
                        className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none"
                      />
                      <button
                        onClick={() => {
                          if (templateName.trim()) {
                            onSaveTemplate!(card, templateName.trim());
                            setSavingTemplate(false);
                          }
                        }}
                        className="rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90"
                      >
                        {t("save")}
                      </button>
                      <button
                        onClick={() => setSavingTemplate(false)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="ml-auto">
                    {!confirm ? (
                      <button
                        onClick={() => setConfirm(true)}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t("delete")}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t("confirm")}</span>
                        <button
                          onClick={() => {
                            onDelete(card.id);
                            onClose();
                          }}
                          className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                        >
                          {t("delete")}
                        </button>
                        <button
                          onClick={() => setConfirm(false)}
                          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Checklist */}
          {!editing && activeTab === "checklist" && (
            <div>
              <ChecklistSection
                card={card}
                onUpdate={(items) => onUpdate(card.id, { checklist: items })}
              />
              <DependenciesSection
                card={card}
                allCards={allCards}
                onUpdate={(blockedBy) => onUpdate(card.id, { blocked_by: blockedBy })}
              />
            </div>
          )}

          {/* Tab: Comentários */}
          {!editing && activeTab === "comentarios" && <CommentsSection cardId={card.id} />}

          {/* Tab: Atividade */}
          {!editing && activeTab === "atividade" && <ActivitySection cardId={card.id} />}

          {/* Tab: Tempo */}
          {!editing && activeTab === "tempo" && <TimeTrackingSection cardId={card.id} />}

          {/* Tab: Anexos */}
          {!editing && activeTab === "anexos" && <AttachmentsSection cardId={card.id} />}
        </div>
      </div>
    </div>
  );
}
