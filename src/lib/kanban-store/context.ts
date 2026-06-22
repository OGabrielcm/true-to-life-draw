// Tipo do contexto Kanban + createContext + hook useKanban.
// Extraído verbatim de kanban-store.tsx — API pública INALTERADA.
import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import {
  Activity,
  Attachment,
  Card,
  CardTemplate,
  Column,
  ColumnId,
  Comment,
  TimeLog,
  Track,
  TrackId,
  Trilha,
} from "../kanban-types";

export type AddInput = Omit<
  Card,
  "id" | "created_at" | "updated_at" | "starred" | "checklist" | "blocked_by" | "order"
> & {
  starred?: boolean;
  checklist?: Card["checklist"];
  blocked_by?: Card["blocked_by"];
  order?: number;
};

export interface KanbanCtx {
  cards: Card[];
  trilhas: Trilha[];
  tracks: Track[];
  columns: Column[];
  collapsed: Record<string, boolean>;
  search: string;
  setSearch: (s: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  selectedAreaIds: string[];
  setSelectedAreaIds: Dispatch<SetStateAction<string[]>>;
  loading: boolean;
  addCard: (data: AddInput) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
  moveCard: (id: string, col: ColumnId, track?: TrackId) => void;
  reorderCard: (
    id: string,
    target: { col?: ColumnId; track?: TrackId; beforeId?: string; afterId?: string },
  ) => void;
  deleteCard: (id: string) => void;
  toggleStar: (id: string) => void;
  duplicateCard: (id: string) => void;
  toggleCollapsed: (id: TrackId) => void;
  createTrilha: (t: Omit<Trilha, "id">) => void;
  updateTrilha: (id: string, data: Omit<Trilha, "id">) => void;
  deleteTrilha: (id: string) => void;
  createTrack: (t: Omit<Track, "id" | "order"> & { order?: number }) => void;
  updateTrack: (id: string, data: Omit<Track, "id">) => void;
  deleteTrack: (id: string) => void;
  createColumn: (name: string, trackId?: string) => void;
  updateColumn: (id: string, data: { name?: string; wip_limit?: number | null }) => void;
  deleteColumn: (id: string) => void;
  getColumnsForTrack: (trackId: string) => Column[];
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  templates: CardTemplate[];
  saveTemplate: (card: Card, name: string) => void;
  updateTemplate: (id: string, name: string) => void;
  deleteTemplate: (id: string) => void;
  cardColors: Record<string, string>;
  setCardColor: (cardId: string, color: string) => void;
  activitiesByCard: Record<string, Activity[]>;
  commentsByCard: Record<string, Comment[]>;
  timeLogsByCard: Record<string, TimeLog[]>;
  attachmentsByCard: Record<string, Attachment[]>;
  loadCardDetails: (cardId: string) => Promise<void>;
  addComment: (cardId: string, text: string) => Promise<void>;
  updateComment: (commentId: string, text: string) => Promise<void>;
  deleteComment: (commentId: string, cardId: string) => Promise<void>;
  addTimeLog: (cardId: string, minutes: number, note?: string, loggedAt?: string) => Promise<void>;
  deleteTimeLog: (logId: string, cardId: string) => Promise<void>;
  addAttachment: (cardId: string, file: File) => Promise<void>;
  deleteAttachment: (attachment: Attachment) => Promise<void>;
}

export const Ctx = createContext<KanbanCtx | null>(null);

export function useKanban() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useKanban must be used inside KanbanProvider");
  return v;
}
