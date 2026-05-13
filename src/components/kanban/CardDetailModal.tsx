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
  Plus,
  Link2,
  AlertTriangle,
  LayoutTemplate,
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
  getChecklistProgress,
  getGoalProgress,
  isBlocked,
} from "@/lib/kanban-types";
import { useTheme } from "@/components/theme-provider";

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
}) {
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const { theme } = useTheme();

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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editing]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={editing ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-card p-5 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        {/* ── CABEÇALHO: badges + estrela + botão editar ── */}
        <div className="flex flex-wrap items-center gap-1.5">
          {!editing ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: prio.bg, color: prio.fg }}
            >
              {card.prio}
            </span>
          ) : (
            <select
              value={editPrio}
              onChange={(e) => setEditPrio(e.target.value as Card["prio"])}
              className="rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium outline-none"
              style={{ borderWidth: "0.5px", backgroundColor: prio.bg, color: prio.fg }}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            style={{ borderWidth: "0.5px" }}
          >
            {card.type === "Goal" && <Target className="h-3 w-3" />}
            {card.type}
          </span>

          {/* Tags — view ou edit */}
          {!editing
            ? card.tags.map((tid) => {
                const t = trilhas.find((x) => x.id === tid);
                if (!t) return null;
                return (
                  <span
                    key={tid}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: t.bg, color: t.fg }}
                  >
                    {t.name}
                  </span>
                );
              })
            : trilhas.map((t) => {
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
                      border: `0.5px solid ${active ? t.bg : "var(--border)"}`,
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}

          <div className="ml-auto flex items-center gap-1">
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {onDuplicate && (
                  <button
                    onClick={() => {
                      onDuplicate(card.id);
                      onClose();
                    }}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Duplicar"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => onToggleStar(card.id)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Favoritar"
            >
              <Star
                className={`h-4 w-4 ${card.starred ? "text-yellow-500" : ""}`}
                fill={card.starred ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>

        {/* ── TÍTULO ── */}
        {!editing ? (
          <h2 className="mt-3 text-lg font-medium text-card-foreground">{card.title}</h2>
        ) : (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-lg font-medium outline-none focus:border-foreground/40"
            style={{ borderWidth: "0.5px" }}
            autoFocus
          />
        )}

        {/* ── DATA ── */}
        {!editing ? (
          card.date && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(card.date)}
            </div>
          )
        ) : (
          <div className="mt-2 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-xs outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
            {editDate && (
              <button
                onClick={() => setEditDate("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {parent && (
          <div className="mt-2 text-xs text-muted-foreground">
            Goal pai: <span className="text-foreground">{parent.title}</span>
          </div>
        )}

        {card.type === "Goal" &&
          (() => {
            const progress = getGoalProgress(card, allCards);
            return (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Progresso</span>
                  <span className="text-xs font-semibold text-foreground">{progress.percent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  {progress.done} de {progress.total} {progress.total === 1 ? "tarefa" : "tarefas"}{" "}
                  concluída{progress.done !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })()}

        {/* ── DESCRIÇÃO ── */}
        {!editing ? (
          card.desc && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-card-foreground/80">{card.desc}</p>
          )
        ) : (
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={4}
            placeholder="Descrição (opcional)"
            className="mt-3 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
            style={{ borderWidth: "0.5px" }}
          />
        )}

        {/* ── BOTÕES SALVAR / CANCELAR ── */}
        {editing && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={saveEdit}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" />
              Salvar
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ── CHECKLIST ── */}
        {!editing && (
          <ChecklistSection
            card={card}
            onUpdate={(items) => onUpdate(card.id, { checklist: items })}
          />
        )}

        {/* ── DEPENDÊNCIAS ── */}
        {!editing && (
          <DependenciesSection
            card={card}
            allCards={allCards}
            onUpdate={(blockedBy) => onUpdate(card.id, { blocked_by: blockedBy })}
          />
        )}

        {/* ── MOVER (só em modo view) ── */}
        {!editing && (
          <>
            <div className="mt-5">
              <p className="text-xs font-medium text-muted-foreground">Mover para coluna</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {columns
                  .filter((c) => c.id !== card.col)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onMove(card.id, c.id);
                        onClose();
                      }}
                      className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      style={{ borderWidth: "0.5px" }}
                    >
                      {c.name}
                    </button>
                  ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Mover para swimlane</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
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
                        className="rounded-md px-2.5 py-1 text-xs font-medium hover:opacity-80"
                        style={{
                          backgroundColor: bg,
                          color: fg,
                          border: `0.5px solid ${t.border}`,
                        }}
                      >
                        {t.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          </>
        )}

        {/* ── RODAPÉ: excluir + fechar ── */}
        {!editing && (
          <div className="mt-6 space-y-3">
            {/* Salvar como template */}
            {onSaveTemplate && !editing && (
              <div>
                {!savingTemplate ? (
                  <button
                    onClick={() => {
                      setSavingTemplate(true);
                      setTemplateName(card.title);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    style={{ borderWidth: "0.5px" }}
                  >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Salvar como template
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setSavingTemplate(false);
                        if (e.key === "Enter" && templateName.trim()) {
                          onSaveTemplate(card, templateName.trim());
                          setSavingTemplate(false);
                        }
                      }}
                      placeholder="Nome do template..."
                      className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-foreground/40"
                      style={{ borderWidth: "0.5px" }}
                    />
                    <button
                      onClick={() => {
                        if (templateName.trim()) {
                          onSaveTemplate(card, templateName.trim());
                          setSavingTemplate(false);
                        }
                      }}
                      className="rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setSavingTemplate(false)}
                      className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              {!confirm ? (
                <button
                  onClick={() => setConfirm(true)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confirmar?</span>
                  <button
                    onClick={() => {
                      onDelete(card.id);
                      onClose();
                    }}
                    className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => setConfirm(false)}
                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
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
