import { useRef, useState } from "react";
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
import { Calendar, CheckSquare, GripVertical, Link2, Star, Target, Trash2 } from "lucide-react";
import {
  Card,
  ColumnId,
  getChecklistProgress,
  getDeadlineStatus,
  getGoalProgress,
  isBlocked,
  getCardAging,
  PRIO_COLORS,
  TrackId,
  Trilha,
  formatDate,
} from "@/lib/kanban-types";
import { useTheme } from "@/components/theme-provider";

export function CardItem({
  card,
  allCards,
  trilhas,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
  onTouchDrop,
  cardColor,
  onToggleStar,
  onDelete,
}: {
  card: Card;
  allCards: Card[];
  trilhas: Trilha[];
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onTouchDrop?: (target: {
    col: ColumnId;
    track: TrackId;
    beforeId?: string;
    afterId?: string;
  }) => void;
  cardColor?: string;
  onToggleStar?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { theme } = useTheme();
  const prioRaw = PRIO_COLORS[card.prio];
  const prio =
    theme === "dark"
      ? { bg: prioRaw.darkBg, fg: prioRaw.darkFg }
      : { bg: prioRaw.bg, fg: prioRaw.fg };
  const isGoal = card.type === "Goal";
  const deadlineStatus = getDeadlineStatus(card);
  const checklistProgress = getChecklistProgress(card);
  const blocked = isBlocked(card, allCards);

  const touchRef = useRef<{ startX: number; startY: number; dragging: boolean } | null>(null);
  const justDraggedRef = useRef(false);

  const handleGripTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, dragging: false };
  };

  const handleGripTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchRef.current.startX);
    const dy = Math.abs(t.clientY - touchRef.current.startY);
    if (!touchRef.current.dragging && (dx > 6 || dy > 6)) {
      touchRef.current.dragging = true;
      onDragStart();
    }
  };

  const handleGripTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    const state = touchRef.current;
    touchRef.current = null;
    if (!state?.dragging) return;

    justDraggedRef.current = true;
    const touch = e.changedTouches[0];

    // Esconde o card momentaneamente para encontrar o elemento abaixo
    const cardEl = (e.currentTarget as HTMLElement).closest(".kb-card") as HTMLElement | null;
    if (cardEl) cardEl.style.visibility = "hidden";
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (cardEl) cardEl.style.visibility = "";

    const colEl = target?.closest("[data-col]");
    if (colEl && onTouchDrop) {
      const col = colEl.getAttribute("data-col") as ColumnId;
      const trackEl = colEl.closest("[data-track]");
      const track = trackEl?.getAttribute("data-track") as TrackId;
      if (!col || !track) {
        onDragEnd();
        return;
      }

      // Verifica se soltou sobre OUTRO card (para reorder dentro da coluna)
      const overCardEl = target?.closest("[data-card-id]") as HTMLElement | null;
      const overCardId = overCardEl?.getAttribute("data-card-id");
      if (overCardEl && overCardId && overCardId !== card.id) {
        // Detecta se foi na metade superior (before) ou inferior (after)
        const rect = overCardEl.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isAfter = touch.clientY >= midY;
        onTouchDrop(
          isAfter ? { col, track, afterId: overCardId } : { col, track, beforeId: overCardId },
        );
      } else {
        // Drop em área vazia → vai pro fim da coluna
        onTouchDrop({ col, track });
      }
    }
    onDragEnd();
  };

  const handleClick = () => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    onClick();
  };

  const aging = getCardAging(card);

  // Cor da barra top: prioridade visual sem side-stripe
  const topBarColor = blocked
    ? "var(--blocked-stripe)"
    : isGoal
      ? "var(--foreground)"
      : deadlineStatus === "overdue"
        ? "var(--color-destructive)"
        : deadlineStatus === "today"
          ? "oklch(0.7 0.18 50)"
          : cardColor && cardColor !== "none"
            ? cardColor
            : prio.fg;

  return (
    <div
      data-card-id={card.id}
      className="kb-card group relative w-full overflow-hidden rounded-lg border bg-card"
      style={{ opacity: isDragging ? 0.4 * aging : aging }}
    >
      {/* Top indicator bar — substitui side-stripe */}
      {topBarColor && (
        <div className="h-[3px] w-full" style={{ backgroundColor: topBarColor }} />
      )}

      {/* Hover actions — só desktop */}
      <div className="absolute right-1.5 top-1.5 hidden items-center gap-0.5 md:flex opacity-0 group-hover:opacity-100 transition-opacity">
        {onToggleStar && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar(card.id); }}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Favoritar"
          >
            <Star
              className="h-3.5 w-3.5"
              fill={card.starred ? "currentColor" : "none"}
              style={{ color: card.starred ? "rgb(234 179 8)" : undefined }}
            />
          </button>
        )}
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                aria-label="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir card</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir <strong>{card.title}</strong>? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(card.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Grip handle — só este elemento captura toque para drag */}
      <div
        onTouchStart={handleGripTouchStart}
        onTouchMove={handleGripTouchMove}
        onTouchEnd={handleGripTouchEnd}
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center p-1.5 text-muted-foreground/40 md:hidden"
        style={{ touchAction: "none" }}
        aria-label="Arrastar card"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Área clicável do card */}
      <button
        onClick={handleClick}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", card.id);
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        className="w-full cursor-grab p-3 text-left active:cursor-grabbing pr-7 md:pr-3"
      >
        {/* Título com font-display (Oswald) */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 flex-1">
            {isGoal && <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />}
            <h3
              className="text-sm leading-snug text-card-foreground line-clamp-2 font-medium"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}
            >
              {card.title}
            </h3>
          </div>
          {card.starred && !onToggleStar && (
            <Star className="h-3.5 w-3.5 shrink-0 text-yellow-500" fill="currentColor" />
          )}
        </div>

        {card.desc && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {card.desc}
          </p>
        )}

        {isGoal &&
          (() => {
            const progress = getGoalProgress(card, allCards);
            if (progress.total === 0) return null;
            return (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground">Progresso</span>
                  <span className="text-[10px] font-semibold text-foreground">
                    {progress.percent}%
                  </span>
                </div>
                <div className="h-[3px] w-full rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/60 transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            );
          })()}

        {/* Chips — com border colorida conforme redesign */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-sm px-1.5 py-0.5 text-[10px] font-mono font-medium border"
            style={{
              backgroundColor: prio.bg,
              color: prio.fg,
              borderColor: prio.fg + "33",
            }}
          >
            {card.prio}
          </span>
          {blocked && (
            <span
              className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-mono font-medium border"
              style={{
                backgroundColor: "var(--blocked-bg)",
                color: "var(--blocked-fg)",
                borderColor: "var(--blocked-border)",
              }}
              title="Bloqueado por dependências pendentes"
            >
              <Link2 className="h-2.5 w-2.5" />
              Bloqueado
            </span>
          )}
          {checklistProgress.total > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground border"
              title={`${checklistProgress.done} de ${checklistProgress.total} concluídos`}
            >
              <CheckSquare className="h-2.5 w-2.5" />
              {checklistProgress.done}/{checklistProgress.total}
            </span>
          )}
          {card.tags.map((tid) => {
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
          })}
        </div>

        {/* Footer com deadline */}
        {card.date && (
          <div className="mt-2 flex items-center border-t pt-2">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                deadlineStatus === "overdue"
                  ? "text-destructive"
                  : deadlineStatus === "today"
                    ? "text-orange-500"
                    : deadlineStatus === "soon"
                      ? "text-yellow-500"
                      : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {deadlineStatus === "overdue"
                ? "Vencido · "
                : deadlineStatus === "today"
                  ? "Hoje · "
                  : ""}
              {formatDate(card.date)}
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
