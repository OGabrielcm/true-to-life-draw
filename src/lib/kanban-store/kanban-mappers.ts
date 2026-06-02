// Helpers puros de mapeamento row↔modelo e cálculo de ordem.
// Extraídos verbatim de kanban-store.tsx (sem mudança de comportamento).
import { Card, Column, ColumnId, Track, TrackId, Trilha } from "../kanban-types";

export function rowToCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as string,
    col: row.col as ColumnId,
    track: row.track as TrackId,
    type: (row.type as Card["type"]) ?? "Task",
    parent_id: row.parent_id as string | undefined,
    title: row.title as string,
    desc: row.desc as string | undefined,
    prio: row.prio as Card["prio"],
    date: row.date as string | undefined,
    starred: (row.starred as boolean) ?? false,
    tags: (row.tags as string[]) ?? [],
    order: (row.order as number) ?? 0,
    checklist: (row.checklist as Card["checklist"]) ?? [],
    blocked_by: (row.blocked_by as string[]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// Calcula o próximo `order` para um card recém-criado em (track, col):
// um a mais que o maior existente naquela coluna+track.
export function nextOrder(cards: Card[], track: TrackId, col: ColumnId): number {
  const inSameCol = cards.filter((c) => c.track === track && c.col === col);
  if (inSameCol.length === 0) return 1;
  return Math.max(...inSameCol.map((c) => c.order)) + 1;
}

export function rowToTrilha(row: Record<string, unknown>): Trilha {
  return {
    id: row.id as string,
    name: row.name as string,
    bg: row.bg as string,
    fg: row.fg as string,
  };
}

export function rowToColumn(row: Record<string, unknown>): Column {
  return {
    id: row.id as string,
    name: row.name as string,
    order: (row.order as number) ?? 0,
    wip_limit: row.wip_limit as number | undefined,
    track_id: (row.track_id as string | null) ?? undefined,
  };
}

export function rowToTrack(row: Record<string, unknown>): Track {
  return {
    id: row.id as string,
    name: row.name as string,
    bg: row.bg as string,
    border: row.border as string,
    fg: row.fg as string,
    darkBg: row.dark_bg as string,
    darkFg: row.dark_fg as string,
    order: (row.order as number) ?? 0,
  };
}

export function trackToRow(t: Omit<Track, "id">): Record<string, unknown> {
  return {
    name: t.name,
    bg: t.bg,
    border: t.border,
    fg: t.fg,
    dark_bg: t.darkBg,
    dark_fg: t.darkFg,
    order: t.order,
  };
}
