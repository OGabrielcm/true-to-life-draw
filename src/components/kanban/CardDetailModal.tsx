import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Pencil,
  Star,
  Trash2,
  Target,
  Check,
  X,
  Copy,
  Plus,
  Link2,
  AlertTriangle,
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
  formatMinutes,
  getChecklistProgress,
  getDeadlineStatus,
  getGoalProgress,
  isBlocked,
} from "@/lib/kanban-types";

function getDeadlineColor(status: ReturnType<typeof getDeadlineStatus>): string {
  if (status === "overdue") return "#ef4444";
  if (status === "today")   return "#f97316";
  if (status === "soon")    return "#eab308";
  return "var(--muted-foreground)";
}
import { useTheme } from "@/components/theme-provider";
import { renderMarkdown } from "@/lib/markdown";
import { CARD_COLOR_PRESETS } from "@/lib/kanban-types";
import { useKanban } from "@/lib/kanban-store";

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
  const { loadCardDetails } = useKanban();

  // Tabs — persiste a aba ativa no localStorage
  type TabId = "detalhes" | "checklist" | "comentarios" | "atividade" | "tempo";
  const TABS: { id: TabId; label: string; shortcut: string }[] = [
    { id: "detalhes",    label: "Detalhes",     shortcut: "1" },
    { id: "checklist",   label: "Checklist",    shortcut: "2" },
    { id: "comentarios", label: "Comentários",  shortcut: "3" },
    { id: "atividade",   label: "Atividade",    shortcut: "4" },
    { id: "tempo",       label: "Tempo",        shortcut: "5" },
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
        if (editing) { setEditing(false); return; }
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
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={editing ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-enter w-full max-w-2xl rounded-xl bg-card shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* ── TOPO: eyebrow + título + ações ── */}
        <div className="p-5 pb-0 flex-shrink-0">
          {/* Eyebrow: track + tipo + badges */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2" style={{ fontFamily: "ui-monospace, monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
              style={{ backgroundColor: prio.bg, color: prio.fg }}
            >
              {card.prio}
            </span>
            <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5" style={{ borderWidth: "0.5px" }}>
              {card.type === "Goal" && <Target className="h-3 w-3" />}
              {card.type}
            </span>
            {card.date && (
              <span className="inline-flex items-center gap-1" style={{ color: getDeadlineColor(getDeadlineStatus(card)) }}>
                <Calendar className="h-3 w-3" />
                {formatDate(card.date)}
              </span>
            )}
            {card.tags.map((tid) => {
              const t = trilhas.find((x) => x.id === tid);
              if (!t) return null;
              return (
                <span key={tid} className="rounded-full px-1.5 py-0.5" style={{ backgroundColor: t.bg, color: t.fg }}>{t.name}</span>
              );
            })}
            {/* Ações no canto direito */}
            <div className="ml-auto flex items-center gap-0.5">
              {!editing && onSetCardColor && (
                <div className="relative">
                  <button onClick={() => setColorOpen(!colorOpen)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Cor de destaque">
                    <div className="h-3 w-3 rounded" style={{ backgroundColor: cardColor && cardColor !== "none" ? cardColor : "var(--muted-foreground)" }} />
                  </button>
                  {colorOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setColorOpen(false)} />
                      <div className="absolute right-0 top-8 z-20 grid w-48 grid-cols-4 gap-1 rounded-lg border bg-background p-2 shadow-md" style={{ borderWidth: "0.5px" }}>
                        {CARD_COLOR_PRESETS.map((preset) => (
                          <button key={preset.name} onClick={() => { onSetCardColor(card.id, preset.name); setColorOpen(false); }} className="h-6 w-6 rounded transition-transform hover:scale-110" style={{ backgroundColor: preset.bg, border: preset.bg === "transparent" ? "1px dashed var(--border)" : undefined }} title={preset.label} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {!editing && (
                <>
                  <button onClick={() => setEditing(true)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                  {onDuplicate && <button onClick={() => { onDuplicate(card.id); onClose(); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Duplicar"><Copy className="h-3.5 w-3.5" /></button>}
                </>
              )}
              <button onClick={() => onToggleStar(card.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Favoritar">
                <Star className={`h-4 w-4 ${card.starred ? "text-yellow-500" : ""}`} fill={card.starred ? "currentColor" : "none"} />
              </button>
              <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Fechar"><X className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Título */}
          {!editing ? (
            <h2 className="text-xl font-semibold text-card-foreground leading-snug" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>{card.title}</h2>
          ) : (
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-lg font-medium outline-none focus:border-foreground/40" style={{ borderWidth: "0.5px" }} autoFocus />
          )}

          {parent && <div className="mt-1 text-xs text-muted-foreground">Goal pai: <span className="text-foreground">{parent.title}</span></div>}

          {/* Tabs — só no modo view */}
          {!editing && (
            <div className="mt-4 flex gap-0 border-b" style={{ borderWidth: "0.5px", marginLeft: "-20px", marginRight: "-20px", paddingLeft: "20px" }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className="px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap border-b-2"
                  style={{
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: activeTab === tab.id ? "var(--foreground)" : "var(--muted-foreground)",
                    borderBottomColor: activeTab === tab.id ? "var(--foreground)" : "transparent",
                    marginBottom: "-1px",
                  }}
                >
                  {tab.label}
                  <span className="ml-1 opacity-40 text-[9px]" style={{ fontFamily: "ui-monospace, monospace" }}>{tab.shortcut}</span>
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
                  <select value={editPrio} onChange={(e) => setEditPrio(e.target.value as Card["prio"])} className="rounded border bg-background px-2 py-1 text-xs outline-none" style={{ borderWidth: "0.5px" }}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="rounded border bg-background px-2 py-1 text-xs outline-none" style={{ borderWidth: "0.5px" }} />
                    {editDate && <button onClick={() => setEditDate("")} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trilhas.map((t) => {
                    const active = editTags.includes(t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => toggleTag(t.id)} className="rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity" style={{ backgroundColor: active ? t.bg : "transparent", color: active ? t.fg : "var(--muted-foreground)", border: `0.5px solid ${active ? t.bg : "var(--border)"}` }}>
                        {t.name}
                      </button>
                    );
                  })}
                </div>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={5} placeholder="Descrição (opcional)" className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40" style={{ borderWidth: "0.5px" }} />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={saveEdit} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"><Check className="h-3.5 w-3.5" />Salvar</button>
                <button onClick={cancelEdit} className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
              </div>
            </>
          )}

          {/* Tab: Detalhes */}
          {!editing && activeTab === "detalhes" && (
            <div>
              {card.type === "Goal" && (() => {
                const progress = getGoalProgress(card, allCards);
                return (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Progresso</span>
                      <span className="text-xs font-semibold text-foreground">{progress.percent}%</span>
                    </div>
                    <div className="h-[3px] w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-foreground transition-all duration-300" style={{ width: `${progress.percent}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{progress.done} de {progress.total} tarefas concluídas</div>
                  </div>
                );
              })()}
              {card.desc ? (
                <div className="mb-5 text-sm text-card-foreground/80 prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: renderMarkdown(card.desc) }} />
              ) : (
                <p className="mb-5 text-xs text-muted-foreground italic">Sem descrição. Pressione <kbd className="rounded border px-1 py-0.5 text-[10px]">e</kbd> para editar.</p>
              )}
              {/* Mover coluna/track */}
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Mover para coluna</p>
                  <div className="flex flex-wrap gap-1.5">
                    {columns.filter((c) => c.id !== card.col).map((c) => (
                      <button key={c.id} onClick={() => { onMove(card.id, c.id); onClose(); }} className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted" style={{ borderWidth: "0.5px" }}>{c.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Mover para track</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tracks.filter((t) => t.id !== card.track).map((t) => {
                      const bg = theme === "dark" ? t.darkBg : t.bg;
                      const fg = theme === "dark" ? t.darkFg : t.fg;
                      return (
                        <button key={t.id} onClick={() => { onMove(card.id, card.col, t.id); onClose(); }} className="rounded-md px-2.5 py-1 text-xs font-medium hover:opacity-80" style={{ backgroundColor: bg, color: fg, border: `0.5px solid ${t.border}` }}>{t.name}</button>
                      );
                    })}
                  </div>
                </div>
                {/* Template + Excluir */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t" style={{ borderWidth: "0.5px" }}>
                  {onSaveTemplate && !savingTemplate && (
                    <button onClick={() => { setSavingTemplate(true); setTemplateName(card.title); }} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground" style={{ borderWidth: "0.5px" }}>
                      <LayoutTemplate className="h-3.5 w-3.5" />Salvar como template
                    </button>
                  )}
                  {savingTemplate && (
                    <div className="flex items-center gap-2">
                      <input autoFocus value={templateName} onChange={(e) => setTemplateName(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setSavingTemplate(false); if (e.key === "Enter" && templateName.trim()) { onSaveTemplate!(card, templateName.trim()); setSavingTemplate(false); } }} placeholder="Nome do template..." className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none" style={{ borderWidth: "0.5px" }} />
                      <button onClick={() => { if (templateName.trim()) { onSaveTemplate!(card, templateName.trim()); setSavingTemplate(false); } }} className="rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90">Salvar</button>
                      <button onClick={() => setSavingTemplate(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                  <div className="ml-auto">
                    {!confirm ? (
                      <button onClick={() => setConfirm(true)} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                        <Trash2 className="h-3.5 w-3.5" />Excluir
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Confirmar?</span>
                        <button onClick={() => { onDelete(card.id); onClose(); }} className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700">Excluir</button>
                        <button onClick={() => setConfirm(false)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
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
              <ChecklistSection card={card} onUpdate={(items) => onUpdate(card.id, { checklist: items })} />
              <DependenciesSection card={card} allCards={allCards} onUpdate={(blockedBy) => onUpdate(card.id, { blocked_by: blockedBy })} />
            </div>
          )}

          {/* Tab: Comentários */}
          {!editing && activeTab === "comentarios" && (
            <CommentsSection cardId={card.id} />
          )}

          {/* Tab: Atividade */}
          {!editing && activeTab === "atividade" && (
            <ActivitySection cardId={card.id} />
          )}

          {/* Tab: Tempo */}
          {!editing && activeTab === "tempo" && (
            <TimeTrackingSection cardId={card.id} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── CHECKLIST SECTION ──
function ChecklistSection({
  card,
  onUpdate,
}: {
  card: Card;
  onUpdate: (items: ChecklistItem[]) => void;
}) {
  const items = card.checklist ?? [];
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const progress = getChecklistProgress(card);

  const addItem = () => {
    const text = newText.trim();
    if (!text) return;
    const newItem: ChecklistItem = { id: crypto.randomUUID(), text, done: false };
    onUpdate([...items, newItem]);
    setNewText("");
  };

  const toggle = (id: string) => {
    onUpdate(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const remove = (id: string) => {
    onUpdate(items.filter((i) => i.id !== id));
  };

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = () => {
    if (!editingId || !editText.trim()) return;
    onUpdate(items.map((i) => (i.id === editingId ? { ...i, text: editText.trim() } : i)));
    setEditingId(null);
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">
          Checklist {items.length > 0 && `(${progress.done}/${progress.total})`}
        </p>
        {items.length > 0 && (
          <span className="text-xs font-semibold text-foreground">{progress.percent}%</span>
        )}
      </div>

      {items.length > 0 && (
        <div className="mb-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/40"
          >
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggle(item.id)}
              className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-foreground"
            />
            {editingId === item.id ? (
              <>
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-md border bg-background px-2 py-0.5 text-sm outline-none focus:border-foreground/40"
                  style={{ borderWidth: "0.5px" }}
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <span
                  onClick={() => startEdit(item)}
                  className={`flex-1 cursor-text text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => remove(item.id)}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Adicionar item..."
          className="flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
          style={{ borderWidth: "0.5px" }}
        />
        <button
          onClick={addItem}
          disabled={!newText.trim()}
          className="rounded-md bg-foreground p-1.5 text-background hover:opacity-90 disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── COMMENTS SECTION ──
function CommentsSection({ cardId }: { cardId: string }) {
  const { commentsByCard, addComment, updateComment, deleteComment } = useKanban();
  const comments = commentsByCard[cardId] ?? [];
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    addComment(cardId, text);
    setText("");
  };

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setEditText(current);
  };

  const saveEdit = () => {
    if (!editingId || !editText.trim()) return;
    updateComment(editingId, editText);
    setEditingId(null);
  };

  return (
    <div className="mt-5">
      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        Comentários {comments.length > 0 && `(${comments.length})`}
      </p>

      <div className="space-y-1.5">
        {comments.map((c) => (
          <div
            key={c.id}
            className="group rounded-md border bg-background px-2.5 py-1.5"
            style={{ borderWidth: "0.5px" }}
          >
            {editingId === c.id ? (
              <div className="flex items-start gap-1.5">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  className="flex-1 resize-none rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
                  style={{ borderWidth: "0.5px" }}
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 whitespace-pre-wrap text-sm text-foreground">{c.text}</p>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => startEdit(c.id, c.text)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteComment(c.id, cardId)}
                      className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(c.created_at).toLocaleString("pt-BR")}
                  {c.updated_at !== c.created_at && " (editado)"}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-start gap-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          placeholder="Adicionar comentário... (Ctrl+Enter)"
          rows={2}
          className="flex-1 resize-none rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
          style={{ borderWidth: "0.5px" }}
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="rounded-md bg-foreground p-1.5 text-background hover:opacity-90 disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── TIME TRACKING SECTION ──
function TimeTrackingSection({ cardId }: { cardId: string }) {
  const { timeLogsByCard, addTimeLog, deleteTimeLog } = useKanban();
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
          Time tracking {logs.length > 0 && `(${logs.length})`}
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
            style={{ borderWidth: "0.5px" }}
          >
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
              {formatMinutes(l.minutes)}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatDate(l.logged_at)}
            </span>
            {l.note && (
              <span className="flex-1 truncate text-xs text-foreground/80">{l.note}</span>
            )}
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
          style={{ borderWidth: "0.5px" }}
        >
          <Plus className="h-3 w-3" />
          Registrar tempo
        </button>
      ) : (
        <div className="mt-2 rounded-md border bg-background p-2" style={{ borderWidth: "0.5px" }}>
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="number"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="h"
              className="w-14 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
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
              style={{ borderWidth: "0.5px" }}
            />
            <span className="text-xs text-muted-foreground">m</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-xs outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota (opcional)"
            className="mt-1.5 w-full rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
            style={{ borderWidth: "0.5px" }}
          />
          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              onClick={submit}
              className="rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background hover:opacity-90"
            >
              Salvar
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
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ACTIVITY SECTION ──
function ActivitySection({ cardId }: { cardId: string }) {
  const { activitiesByCard } = useKanban();
  const activities = activitiesByCard[cardId] ?? [];
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? activities : activities.slice(0, 5);

  if (activities.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <ActivityIcon className="h-3 w-3" />
        Atividades ({activities.length})
      </p>
      <div className="space-y-0.5">
        {visible.map((a) => (
          <div
            key={a.id}
            className="flex items-baseline gap-2 rounded px-1 py-0.5 text-xs text-muted-foreground"
          >
            <span className="shrink-0 text-[10px] tabular-nums">
              {new Date(a.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex-1 text-foreground/80">{a.message}</span>
          </div>
        ))}
      </div>
      {activities.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Mostrar menos" : `Ver todas (${activities.length})`}
        </button>
      )}
    </div>
  );
}

// ── DEPENDENCIES SECTION ──
function DependenciesSection({
  card,
  allCards,
  onUpdate,
}: {
  card: Card;
  allCards: Card[];
  onUpdate: (blockedBy: string[]) => void;
}) {
  const blockedBy = card.blocked_by ?? [];
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  const blockers = blockedBy
    .map((id) => allCards.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c));

  const blocked = isBlocked(card, allCards);

  // Cards disponíveis para adicionar (não inclui o próprio e nem os já adicionados)
  const available = allCards
    .filter(
      (c) =>
        c.id !== card.id &&
        !blockedBy.includes(c.id) &&
        (search.trim() ? c.title.toLowerCase().includes(search.trim().toLowerCase()) : true),
    )
    .slice(0, 8);

  const addBlocker = (id: string) => {
    onUpdate([...blockedBy, id]);
    setSearch("");
    setAdding(false);
  };

  const removeBlocker = (id: string) => {
    onUpdate(blockedBy.filter((b) => b !== id));
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5">
          <Link2 className="h-3 w-3" />
          Bloqueado por {blockers.length > 0 && `(${blockers.length})`}
        </p>
        {blocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-3 w-3" />
            Bloqueado
          </span>
        )}
      </div>

      <div className="space-y-1">
        {blockers.map((b) => {
          const resolved = b.col === "done";
          return (
            <div
              key={b.id}
              className="group flex items-center gap-2 rounded-md border bg-background px-2 py-1.5"
              style={{ borderWidth: "0.5px" }}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${resolved ? "bg-green-500" : "bg-red-500"}`}
                title={resolved ? "Concluído" : "Pendente"}
              />
              <span
                className={`flex-1 truncate text-sm ${resolved ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {b.title}
              </span>
              <button
                onClick={() => removeBlocker(b.id)}
                className="opacity-0 group-hover:opacity-100 rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          style={{ borderWidth: "0.5px" }}
        >
          <Plus className="h-3 w-3" />
          Adicionar dependência
        </button>
      ) : (
        <div className="mt-2 rounded-md border bg-background p-2" style={{ borderWidth: "0.5px" }}>
          <div className="flex items-center gap-1.5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar card..."
              className="flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
              autoFocus
            />
            <button
              onClick={() => {
                setAdding(false);
                setSearch("");
              }}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto">
            {available.length === 0 ? (
              <p className="px-1 py-1 text-xs text-muted-foreground">Nenhum card encontrado.</p>
            ) : (
              available.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addBlocker(c.id)}
                  className="block w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted"
                >
                  {c.title}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
