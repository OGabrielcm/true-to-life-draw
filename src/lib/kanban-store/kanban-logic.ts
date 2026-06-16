// Lógica de domínio PURA do kanban-store — sem React, sem Supabase.
// Extraída VERBATIM dos closures do provider.tsx para que as três
// computações não-triviais (cálculo de ordem no reorder, cascata cruzada
// ao deletar track/column) sejam testáveis isoladamente. O provider passa
// a apenas orquestrar: chama estas funções, aplica o estado e persiste.
import { Card, Column, ColumnId, Track, TrackId } from "../kanban-types";

// Tolerância para comparar `order` (float) — ver Card.order em kanban-types.
const ORDER_EPSILON = 1e-9;

export interface ReorderResult {
  col: ColumnId;
  track: TrackId;
  order: number;
}

// Calcula o novo (col, track, order) de um card arrastado. Espelha a lógica
// de reorderCard. Retorna `null` quando a operação deve ser abortada:
//   - card inexistente;
//   - beforeId/afterId não encontrados na coluna alvo (âncora inválida);
//   - nenhuma mudança real (mesma col, mesma track, mesmo order).
export function computeReorderOrder(
  cards: Card[],
  id: string,
  target: { col?: ColumnId; track?: TrackId; beforeId?: string; afterId?: string },
): ReorderResult | null {
  const card = cards.find((c) => c.id === id);
  if (!card) return null;
  const targetCol = target.col ?? card.col;
  const targetTrack = target.track ?? card.track;
  // Cards da coluna alvo, ordenados, excluindo o próprio card movido.
  const sameColumn = cards
    .filter((c) => c.track === targetTrack && c.col === targetCol && c.id !== id)
    .sort((a, b) => a.order - b.order);

  let newOrder: number;
  if (target.beforeId) {
    const beforeIdx = sameColumn.findIndex((c) => c.id === target.beforeId);
    if (beforeIdx === -1) return null;
    const before = sameColumn[beforeIdx];
    const prev = sameColumn[beforeIdx - 1];
    newOrder = prev ? (prev.order + before.order) / 2 : before.order - 1;
  } else if (target.afterId) {
    const afterIdx = sameColumn.findIndex((c) => c.id === target.afterId);
    if (afterIdx === -1) return null;
    const after = sameColumn[afterIdx];
    const next = sameColumn[afterIdx + 1];
    newOrder = next ? (after.order + next.order) / 2 : after.order + 1;
  } else {
    // Sem âncora: vai pro final da coluna alvo.
    newOrder = sameColumn.length ? sameColumn[sameColumn.length - 1].order + 1 : 1;
  }

  const colChanged = targetCol !== card.col;
  const trackChanged = targetTrack !== card.track;
  const orderChanged = Math.abs(newOrder - card.order) > ORDER_EPSILON;
  if (!colChanged && !trackChanged && !orderChanged) return null;

  return { col: targetCol, track: targetTrack, order: newOrder };
}

// Resultado de uma deleção em cascata (track ou column). Carrega tanto o novo
// estado local (cards/lista de entidades) quanto o ESCOPO da persistência:
//   - fallbackId != null  → cards órfãos foram REATRIBUÍDOS a fallbackId;
//   - fallbackId == null  → não havia fallback, cards órfãos foram REMOVIDOS.
// movedCardIds / deletedCardIds existem para o provider saber o que persistir
// e para os testes asseverarem o efeito sem tocar no banco.
export interface CascadeDeletionResult<T> {
  cards: Card[];
  remaining: T[];
  fallbackId: string | null;
  movedCardIds: string[];
  deletedCardIds: string[];
}

// Deleta uma track movendo seus cards para a primeira track restante; se não
// houver track restante, apaga os cards daquela track. Espelha deleteTrack.
export function computeTrackDeletion(
  cards: Card[],
  tracks: Track[],
  id: TrackId,
  now: string,
): CascadeDeletionResult<Track> {
  const remaining = tracks.filter((t) => t.id !== id);
  const fallback = remaining[0];
  const orphans = cards.filter((c) => c.track === id);
  if (fallback) {
    return {
      cards: cards.map((c) => (c.track === id ? { ...c, track: fallback.id, updated_at: now } : c)),
      remaining,
      fallbackId: fallback.id,
      movedCardIds: orphans.map((c) => c.id),
      deletedCardIds: [],
    };
  }
  return {
    cards: cards.filter((c) => c.track !== id),
    remaining,
    fallbackId: null,
    movedCardIds: [],
    deletedCardIds: orphans.map((c) => c.id),
  };
}

// Deleta uma column movendo seus cards para a primeira column restante; se não
// houver column restante, apaga os cards daquela column. Espelha deleteColumn.
export function computeColumnDeletion(
  cards: Card[],
  columns: Column[],
  id: ColumnId,
  now: string,
): CascadeDeletionResult<Column> {
  const remaining = columns.filter((c) => c.id !== id);
  const fallback = remaining[0];
  const orphans = cards.filter((c) => c.col === id);
  if (fallback) {
    return {
      cards: cards.map((c) => (c.col === id ? { ...c, col: fallback.id, updated_at: now } : c)),
      remaining,
      fallbackId: fallback.id,
      movedCardIds: orphans.map((c) => c.id),
      deletedCardIds: [],
    };
  }
  return {
    cards: cards.filter((c) => c.col !== id),
    remaining,
    fallbackId: null,
    movedCardIds: [],
    deletedCardIds: orphans.map((c) => c.id),
  };
}
