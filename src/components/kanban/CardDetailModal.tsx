import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Star,
  Trash2,
  Target,
  X,
  Copy,
  LayoutTemplate,
  Check,
  ChevronDown,
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
  if (status === "today") return "rgb(249 115 22)";
  if (status === "soon") return "rgb(234 179 8)";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [colorOpen, setColorOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.desc ?? "");
  const { theme } = useTheme();
  const { t } = useLocale();
  const { loadCardDetails, commentsByCard, activitiesByCard, timeLogsByCard, attachmentsByCard } =
    useKanban();

  const checklistProg = getChecklistProgress(card);

  type TabId = "checklist" | "comentarios" | "atividade" | "tempo" | "anexos";
  const TABS: { id: TabId; label: string; shortcut: string }[] = [
    { id: "checklist", label: t("tab_checklist"), shortcut: "1" },
    { id: "comentarios", label: t("tab_comments"), shortcut: "2" },
    { id: "atividade", label: t("tab_activity"), shortcut: "3" },
    { id: "tempo", label: t("tab_time"), shortcut: "4" },
    { id: "anexos", label: t("tab_attachments"), shortcut: "5" },
  ];

  const tabCounts: Record<TabId, string | null> = {
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

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem("molas-modal-tab-v2") as TabId | null;
    return saved && TABS.some((t) => t.id === saved) ? saved : "checklist";
  });
  const switchTab = (id: TabId) => {
    setActiveTab(id);
    localStorage.setItem("molas-modal-tab-v2", id);
  };

  useEffect(() => {
    loadCardDetails(card.id);
  }, [card.id, loadCardDetails]);

  // Sync when card changes externally
  useEffect(() => {
    if (!editingTitle) setEditTitle(card.title);
    if (!editingDesc) setEditDesc(card.desc ?? "");
  }, [card, editingTitle, editingDesc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingTitle) {
          setEditingTitle(false);
          setEditTitle(card.title);
          return;
        }
        if (editingDesc) {
          setEditingDesc(false);
          setEditDesc(card.desc ?? "");
          return;
        }
        onClose();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      )
        return;

      // 1-5 para tabs
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < TABS.length) {
        e.preventDefault();
        switchTab(TABS[idx].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editingTitle, editingDesc, card]);

  const saveTitle = () => {
    if (!editTitle.trim()) {
      setEditTitle(card.title);
      setEditingTitle(false);
      return;
    }
    onUpdate(card.id, { title: editTitle.trim() });
    setEditingTitle(false);
  };

  const saveDesc = () => {
    onUpdate(card.id, { desc: editDesc.trim() || undefined });
    setEditingDesc(false);
  };

  const prioRaw = PRIO_COLORS[card.prio];
  const prio =
    theme === "dark"
      ? { bg: prioRaw.darkBg, fg: prioRaw.darkFg }
      : { bg: prioRaw.bg, fg: prioRaw.fg };
  const parent = card.parent_id ? allCards.find((c) => c.id === card.parent_id) : null;

  const cyclePrio = () => {
    const idx = PRIORITIES.indexOf(card.prio);
    const next = PRIORITIES[(idx + 1) % PRIORITIES.length];
    onUpdate(card.id, { prio: next });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-foreground/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-enter w-full max-w-4xl rounded-xl bg-card shadow-2xl max-h-[88vh] flex flex-col overflow-hidden border border-border"
      >
        {/* ── HEADER ── */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {/* Eyebrow */}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2 font-mono uppercase tracking-widest flex-wrap">
                <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5">
                  {card.type === "Goal" && <Target className="h-3 w-3" />}
                  {card.type}
                </span>
                {parent && (
                  <span className="text-muted-foreground">
                    ↳ <span className="text-foreground">{parent.title}</span>
                  </span>
                )}
              </div>

              {/* Title — inline edit */}
              {editingTitle ? (
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") {
                      setEditingTitle(false);
                      setEditTitle(card.title);
                    }
                  }}
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xl font-semibold outline-none focus:border-foreground/40"
                  style={{ fontFamily: "var(--font-display)" }}
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(true)}
                  className="text-xl font-semibold text-card-foreground leading-snug cursor-text hover:bg-muted/50 rounded px-1 -mx-1 py-0.5"
                  style={{ fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}
                  title="Clique para editar"
                >
                  {card.title}
                </h2>
              )}
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {onSetCardColor && (
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
                              onSetCardColor!(card.id, preset.name);
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
        </div>

        {/* ── BODY: two-column on md+, stacked on mobile ── */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* ── LEFT: description + tabs ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 min-w-0">
            {/* Goal progress */}
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

            {/* Description — inline edit */}
            <div className="mb-5">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                {t("tab_details")}
              </p>
              {editingDesc ? (
                <div>
                  <textarea
                    autoFocus
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={5}
                    placeholder={t("desc_optional")}
                    className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={saveDesc}
                      className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t("save")}
                    </button>
                    <button
                      onClick={() => {
                        setEditingDesc(false);
                        setEditDesc(card.desc ?? "");
                      }}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : card.desc ? (
                <div
                  onClick={() => setEditingDesc(true)}
                  className="text-sm text-card-foreground/80 prose prose-sm dark:prose-invert cursor-text hover:bg-muted/40 rounded p-1 -mx-1"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(card.desc) }}
                />
              ) : (
                <button
                  onClick={() => setEditingDesc(true)}
                  className="text-xs text-muted-foreground italic hover:text-foreground text-left"
                >
                  {t("no_desc")} — clique para adicionar
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b -mx-6 px-6 mb-5">
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

            {activeTab === "checklist" && (
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
            {activeTab === "comentarios" && <CommentsSection cardId={card.id} />}
            {activeTab === "atividade" && <ActivitySection cardId={card.id} />}
            {activeTab === "tempo" && <TimeTrackingSection cardId={card.id} />}
            {activeTab === "anexos" && <AttachmentsSection cardId={card.id} />}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="w-full md:w-64 flex-shrink-0 border-t md:border-t-0 md:border-l border-border overflow-y-auto px-4 py-5 space-y-5">
            {/* Priority */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Prioridade
              </p>
              <button
                onClick={cyclePrio}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: prio.bg, color: prio.fg }}
                title="Clique para trocar"
              >
                {card.prio}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </div>

            {/* Deadline */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Prazo
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={card.date ?? ""}
                  onChange={(e) => onUpdate(card.id, { date: e.target.value || undefined })}
                  className="rounded border bg-background px-2 py-1 text-xs outline-none focus:border-foreground/40"
                  style={{
                    color: card.date ? getDeadlineColor(getDeadlineStatus(card)) : undefined,
                  }}
                />
                {card.date && (
                  <button
                    onClick={() => onUpdate(card.id, { date: undefined })}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Trilhas (tags) */}
            {trilhas.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  Trilhas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {trilhas.map((tr) => {
                    const active = card.tags.includes(tr.id);
                    return (
                      <button
                        key={tr.id}
                        onClick={() => {
                          const next = active
                            ? card.tags.filter((x) => x !== tr.id)
                            : [...card.tags, tr.id];
                          onUpdate(card.id, { tags: next });
                        }}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity"
                        style={{
                          backgroundColor: active ? tr.bg : "transparent",
                          color: active ? tr.fg : "var(--muted-foreground)",
                          border: `1px solid ${active ? tr.bg : "var(--border)"}`,
                        }}
                      >
                        {tr.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Move column */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("move_to_column")}
              </p>
              <div className="flex flex-wrap gap-1">
                {columns
                  .filter((c) => c.id !== card.col)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onMove(card.id, c.id);
                        onClose();
                      }}
                      className="rounded border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      {c.name}
                    </button>
                  ))}
              </div>
            </div>

            {/* Move track */}
            {tracks.length > 1 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("move_to_track")}
                </p>
                <div className="flex flex-wrap gap-1">
                  {tracks
                    .filter((tr) => tr.id !== card.track)
                    .map((tr) => {
                      const bg = theme === "dark" ? tr.darkBg : tr.bg;
                      const fg = theme === "dark" ? tr.darkFg : tr.fg;
                      return (
                        <button
                          key={tr.id}
                          onClick={() => {
                            onMove(card.id, card.col, tr.id);
                            onClose();
                          }}
                          className="rounded px-2 py-1 text-xs font-medium hover:opacity-80"
                          style={{
                            backgroundColor: bg,
                            color: fg,
                            border: `1px solid ${tr.border}`,
                          }}
                        >
                          {tr.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Divider + actions */}
            <div className="pt-2 border-t border-border space-y-1">
              {onSaveTemplate && !savingTemplate && (
                <button
                  onClick={() => {
                    setSavingTemplate(true);
                    setTemplateName(card.title);
                  }}
                  className="inline-flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  {t("save_as_template")}
                </button>
              )}
              {savingTemplate && (
                <div className="space-y-2">
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
                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none"
                  />
                  <div className="flex gap-1">
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
                </div>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="inline-flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("delete")}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir card</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir <strong>{card.title}</strong>? Esta ação não
                      pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onDelete(card.id);
                        onClose();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
