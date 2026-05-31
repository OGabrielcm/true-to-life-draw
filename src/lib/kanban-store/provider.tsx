// Kernel do KanbanProvider: entidades (cards/tracks/trilhas/columns) +
// estado de UI fortemente acoplado (filter/trackFilter/collapsed/search/
// createOpen/loading) + efeito de load + TODAS as ações que tocam essas
// entidades. Mantido junto DE PROPÓSITO: as ações de delete cruzam domínios
// (deleteTrack mexe em cards/trackFilter/collapsed; deleteTrilha em cards/
// filter), então separá-las criaria acoplamento via setters injetados.
//
// Ações movidas VERBATIM de kanban-store.tsx (sem edição de lógica).
// Slices independentes (card-details, templates, card-colors) compostos via
// hooks. A divisão value/fullValue (dois useMemo) é preservada para que
// mudanças em activities/comments/timeLogs NÃO recriem os closures do kernel.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Card, Column, Track, Trilha, loadCollapsed, saveCollapsed } from "../kanban-types";
import { supabase } from "../supabase";
import { Ctx, KanbanCtx } from "./context";
import {
  nextOrder,
  rowToCard,
  rowToColumn,
  rowToTrack,
  rowToTrilha,
  trackToRow,
} from "./kanban-mappers";
import { useCardDetails } from "./use-card-details";
import { useTemplates } from "./use-templates";
import { useCardColors } from "./use-card-colors";

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("__all");
  const [trackFilter, setTrackFilter] = useState("__all");
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    activitiesByCard,
    commentsByCard,
    timeLogsByCard,
    currentUserIdRef,
    logActivity,
    loadCardDetails,
    addComment,
    updateComment,
    deleteComment,
    addTimeLog,
    deleteTimeLog,
  } = useCardDetails();
  const { templates, saveTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const { cardColors, setCardColor } = useCardColors();

  const loadInFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const runLoad = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      currentUserIdRef.current = user.id;

      const [{ data: dbCards }, { data: dbTrilhas }, { data: dbTracks }, { data: dbColumns }] =
        await Promise.all([
          supabase.from("tasks").select("*").order("created_at"),
          supabase.from("trilhas").select("*").order("created_at"),
          supabase.from("tracks").select("*").order("order"),
          supabase.from("columns").select("*").order("order"),
        ]);

      if (cancelled) return;

      // Sem seed automático: trilhas, tracks, columns e cards iniciais
      // são criadas pelo usuário no Onboarding Beta (e depois em /settings).
      if (!cancelled) {
        setTracks((dbTracks ?? []).map(rowToTrack));
        setCards((dbCards ?? []).map(rowToCard));
        setTrilhas((dbTrilhas ?? []).map(rowToTrilha));
        setColumns((dbColumns ?? []).map(rowToColumn).sort((a, b) => a.order - b.order));
        setLoading(false);
      }
    };

    // Deduplica chamadas concorrentes: se já houver um load() em curso,
    // retorna a mesma Promise em vez de iniciar outro (evita race condition
    // que duplicava o seed em contas novas — load inicial vs SIGNED_IN).
    const load = () => {
      if (loadInFlightRef.current) return loadInFlightRef.current;
      const p = runLoad().finally(() => {
        loadInFlightRef.current = null;
      });
      loadInFlightRef.current = p;
      return p;
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") load();
      if (event === "SIGNED_OUT") {
        setCards([]);
        setTrilhas([]);
        setTracks([]);
        setColumns([]);
        setLoading(true);
      }
    });

    load();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveCollapsed(collapsed);
  }, [collapsed]);

  const value = useMemo<Omit<KanbanCtx, "activitiesByCard" | "commentsByCard" | "timeLogsByCard">>(
    () => ({
      cards,
      trilhas,
      tracks,
      columns,
      collapsed,
      search,
      setSearch,
      filter,
      setFilter,
      trackFilter,
      setTrackFilter,
      loading,
      createOpen,
      setCreateOpen,
      templates,
      cardColors,

      addCard: async (data) => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        currentUserIdRef.current = user.id;
        const now = new Date().toISOString();
        const tempId = crypto.randomUUID();
        const newCard: Card = {
          ...data,
          starred: data.starred ?? false,
          order: nextOrder(cards, data.track, data.col),
          checklist: data.checklist ?? [],
          blocked_by: data.blocked_by ?? [],
          id: tempId,
          created_at: now,
          updated_at: now,
        };
        setCards((cur) => [...cur, newCard]);
        const { data: inserted, error } = await supabase
          .from("tasks")
          .insert({ ...newCard, user_id: user.id })
          .select()
          .single();
        if (error) {
          setCards((cur) => cur.filter((c) => c.id !== tempId));
        } else if (inserted) {
          const real = rowToCard(inserted);
          setCards((cur) => cur.map((c) => (c.id === tempId ? real : c)));
          logActivity(real.id, "created", `Card criado: "${real.title}"`);
        }
      },

      updateCard: async (id, patch) => {
        const now = new Date().toISOString();
        const before = cards.find((c) => c.id === id);
        setCards((cur) => cur.map((c) => (c.id === id ? { ...c, ...patch, updated_at: now } : c)));
        await supabase
          .from("tasks")
          .update({ ...patch, updated_at: now })
          .eq("id", id);
        if (before) {
          if (patch.title !== undefined && patch.title !== before.title) {
            logActivity(id, "edited", `Título alterado para "${patch.title}"`);
          }
          if (patch.desc !== undefined && patch.desc !== before.desc) {
            logActivity(id, "edited", "Descrição atualizada");
          }
          if (patch.prio !== undefined && patch.prio !== before.prio) {
            logActivity(id, "priority", `Prioridade: ${before.prio} → ${patch.prio}`);
          }
          if (patch.date !== undefined && patch.date !== before.date) {
            logActivity(id, "deadline", patch.date ? `Prazo: ${patch.date}` : "Prazo removido");
          }
          if (patch.checklist !== undefined) {
            logActivity(id, "checklist", "Checklist atualizado");
          }
          if (patch.blocked_by !== undefined) {
            const wasBlocked = (before.blocked_by ?? []).length > 0;
            const isBlocked = (patch.blocked_by ?? []).length > 0;
            if (wasBlocked !== isBlocked) {
              logActivity(
                id,
                isBlocked ? "blocked" : "unblocked",
                isBlocked ? "Dependência adicionada" : "Dependências removidas",
              );
            }
          }
        }
      },

      moveCard: async (id, col, track) => {
        const now = new Date().toISOString();
        const before = cards.find((c) => c.id === id);
        const targetTrack = track ?? cards.find((c) => c.id === id)?.track;
        if (!targetTrack) return;
        // Card que muda de coluna/track vai pro final da nova coluna
        const newOrder = nextOrder(
          cards.filter((c) => c.id !== id),
          targetTrack,
          col,
        );
        const patch: Partial<Card> = { col, order: newOrder, updated_at: now };
        if (track) patch.track = track;
        setCards((cur) =>
          cur.map((c) =>
            c.id === id
              ? { ...c, col, track: track ?? c.track, order: newOrder, updated_at: now }
              : c,
          ),
        );
        await supabase.from("tasks").update(patch).eq("id", id);
        if (before && before.col !== col) {
          const fromName = columns.find((c) => c.id === before.col)?.name ?? before.col;
          const toName = columns.find((c) => c.id === col)?.name ?? col;
          logActivity(id, "moved", `Movido: ${fromName} → ${toName}`);
        }
      },

      reorderCard: async (id, target) => {
        const card = cards.find((c) => c.id === id);
        if (!card) return;
        const targetCol = target.col ?? card.col;
        const targetTrack = target.track ?? card.track;
        // Pega cards da coluna alvo, ordenados (excluindo o próprio)
        const sameColumn = cards
          .filter((c) => c.track === targetTrack && c.col === targetCol && c.id !== id)
          .sort((a, b) => a.order - b.order);

        let newOrder: number;
        if (target.beforeId) {
          const beforeIdx = sameColumn.findIndex((c) => c.id === target.beforeId);
          if (beforeIdx === -1) return;
          const before = sameColumn[beforeIdx];
          const prev = sameColumn[beforeIdx - 1];
          newOrder = prev ? (prev.order + before.order) / 2 : before.order - 1;
        } else if (target.afterId) {
          const afterIdx = sameColumn.findIndex((c) => c.id === target.afterId);
          if (afterIdx === -1) return;
          const after = sameColumn[afterIdx];
          const next = sameColumn[afterIdx + 1];
          newOrder = next ? (after.order + next.order) / 2 : after.order + 1;
        } else {
          newOrder = sameColumn.length ? sameColumn[sameColumn.length - 1].order + 1 : 1;
        }

        // Sem mudança real
        const colChanged = targetCol !== card.col;
        const trackChanged = targetTrack !== card.track;
        const orderChanged = Math.abs(newOrder - card.order) > 1e-9;
        if (!colChanged && !trackChanged && !orderChanged) return;

        const now = new Date().toISOString();
        setCards((cur) =>
          cur.map((c) =>
            c.id === id
              ? { ...c, col: targetCol, track: targetTrack, order: newOrder, updated_at: now }
              : c,
          ),
        );
        await supabase
          .from("tasks")
          .update({ col: targetCol, track: targetTrack, order: newOrder, updated_at: now })
          .eq("id", id);
      },

      deleteCard: async (id) => {
        setCards((cur) => cur.filter((c) => c.id !== id));
        await supabase.from("tasks").delete().eq("id", id);
      },

      toggleStar: async (id) => {
        const now = new Date().toISOString();
        setCards((cur) =>
          cur.map((c) => (c.id === id ? { ...c, starred: !c.starred, updated_at: now } : c)),
        );
        const card = cards.find((c) => c.id === id);
        if (card) {
          await supabase
            .from("tasks")
            .update({ starred: !card.starred, updated_at: now })
            .eq("id", id);
          logActivity(
            id,
            card.starred ? "unstarred" : "starred",
            card.starred ? "Removido dos favoritos" : "Marcado como favorito",
          );
        }
      },

      duplicateCard: async (id) => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const original = cards.find((c) => c.id === id);
        if (!user || !original) return;
        const now = new Date().toISOString();
        const tempId = crypto.randomUUID();
        const newCard: Card = {
          ...original,
          id: tempId,
          title: `${original.title} (copy)`,
          starred: false,
          order: nextOrder(cards, original.track, original.col),
          // Reseta estado de progresso: checklist desmarcado, sem dependências
          checklist: (original.checklist ?? []).map((i) => ({
            ...i,
            id: crypto.randomUUID(),
            done: false,
          })),
          blocked_by: [],
          created_at: now,
          updated_at: now,
        };
        setCards((cur) => [...cur, newCard]);
        const { data: inserted, error } = await supabase
          .from("tasks")
          .insert({ ...newCard, user_id: user.id })
          .select()
          .single();
        if (error) {
          setCards((cur) => cur.filter((c) => c.id !== tempId));
        } else if (inserted) {
          const real = rowToCard(inserted);
          setCards((cur) => cur.map((c) => (c.id === tempId ? real : c)));
          logActivity(real.id, "duplicated", `Duplicado de "${original.title}"`);
        }
      },

      toggleCollapsed: (id) => setCollapsed((cur) => ({ ...cur, [id]: !cur[id] })),

      saveTemplate,
      updateTemplate,
      deleteTemplate,
      setCardColor,

      getColumnsForTrack: (trackId) => {
        const trackCols = columns.filter((c) => c.track_id === trackId);
        if (trackCols.length > 0) return trackCols.sort((a, b) => a.order - b.order);
        return columns.filter((c) => !c.track_id).sort((a, b) => a.order - b.order);
      },

      loadCardDetails,
      addComment,
      updateComment,
      deleteComment,
      addTimeLog,
      deleteTimeLog,

      createTrilha: async (t) => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const tempId = crypto.randomUUID();
        setTrilhas((cur) => [...cur, { ...t, id: tempId }]);
        const { data: inserted, error } = await supabase
          .from("trilhas")
          .insert({ ...t, user_id: user.id })
          .select()
          .single();
        if (error) {
          setTrilhas((cur) => cur.filter((x) => x.id !== tempId));
        } else if (inserted) {
          setTrilhas((cur) => cur.map((x) => (x.id === tempId ? rowToTrilha(inserted) : x)));
        }
      },

      updateTrilha: async (id, data) => {
        setTrilhas((cur) => cur.map((t) => (t.id === id ? { ...t, ...data } : t)));
        await supabase.from("trilhas").update(data).eq("id", id);
      },

      deleteTrilha: async (id) => {
        setTrilhas((cur) => cur.filter((t) => t.id !== id));
        setCards((cur) => cur.map((c) => ({ ...c, tags: c.tags.filter((x) => x !== id) })));
        setFilter((f) => (f === id ? "__all" : f));
        await supabase.from("trilhas").delete().eq("id", id);
        await supabase.rpc("remove_tag_from_tasks", { tag_id: id });
      },

      createTrack: async (input) => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const tempId = crypto.randomUUID();
        const order =
          input.order ?? (tracks.length ? Math.max(...tracks.map((t) => t.order)) + 1 : 0);
        const newTrack: Track = { ...input, id: tempId, order };
        setTracks((cur) => [...cur, newTrack].sort((a, b) => a.order - b.order));
        const { data: inserted, error } = await supabase
          .from("tracks")
          .insert({ ...trackToRow(newTrack), user_id: user.id })
          .select()
          .single();
        if (error) {
          setTracks((cur) => cur.filter((x) => x.id !== tempId));
        } else if (inserted) {
          setTracks((cur) =>
            cur
              .map((x) => (x.id === tempId ? rowToTrack(inserted) : x))
              .sort((a, b) => a.order - b.order),
          );
        }
      },

      updateTrack: async (id, data) => {
        setTracks((cur) =>
          cur.map((t) => (t.id === id ? { ...t, ...data } : t)).sort((a, b) => a.order - b.order),
        );
        await supabase.from("tracks").update(trackToRow(data)).eq("id", id);
      },

      deleteTrack: async (id) => {
        // Move cards desta track para a primeira track restante (se houver)
        const remaining = tracks.filter((t) => t.id !== id);
        const fallback = remaining[0];
        if (fallback) {
          const now = new Date().toISOString();
          setCards((cur) =>
            cur.map((c) => (c.track === id ? { ...c, track: fallback.id, updated_at: now } : c)),
          );
          await supabase
            .from("tasks")
            .update({ track: fallback.id, updated_at: now })
            .eq("track", id);
        } else {
          // Sem track de fallback: apaga os cards desta track
          setCards((cur) => cur.filter((c) => c.track !== id));
          await supabase.from("tasks").delete().eq("track", id);
        }
        setTracks(remaining);
        setTrackFilter((f) => (f === id ? "__all" : f));
        setCollapsed((cur) => {
          const next = { ...cur };
          delete next[id];
          return next;
        });
        await supabase.from("tracks").delete().eq("id", id);
      },

      createColumn: async (name, trackId) => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const tempId = crypto.randomUUID();
        const scopedCols = trackId
          ? columns.filter((c) => c.track_id === trackId)
          : columns.filter((c) => !c.track_id);
        const order = scopedCols.length ? Math.max(...scopedCols.map((c) => c.order)) + 1 : 5;
        const newCol: Column = { id: tempId, name: name.trim(), order, track_id: trackId };
        setColumns((cur) => [...cur, newCol].sort((a, b) => a.order - b.order));
        const { data: inserted, error } = await supabase
          .from("columns")
          .insert({
            id: tempId,
            name: name.trim(),
            order,
            user_id: user.id,
            track_id: trackId ?? null,
          })
          .select()
          .single();
        if (error) {
          setColumns((cur) => cur.filter((c) => c.id !== tempId));
        } else if (inserted) {
          setColumns((cur) =>
            cur
              .map((c) => (c.id === tempId ? rowToColumn(inserted) : c))
              .sort((a, b) => a.order - b.order),
          );
        }
      },

      updateColumn: async (id, data) => {
        const patch: Record<string, unknown> = {};
        if (data.name !== undefined) patch.name = data.name.trim();
        if (data.wip_limit !== undefined) patch.wip_limit = data.wip_limit;
        setColumns((cur) =>
          cur.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...(data.name ? { name: data.name.trim() } : {}),
                  ...(data.wip_limit !== undefined
                    ? { wip_limit: data.wip_limit ?? undefined }
                    : {}),
                }
              : c,
          ),
        );
        await supabase.from("columns").update(patch).eq("id", id);
      },

      deleteColumn: async (id) => {
        const remaining = columns.filter((c) => c.id !== id);
        const fallback = remaining[0];
        if (fallback) {
          const now = new Date().toISOString();
          setCards((cur) =>
            cur.map((c) => (c.col === id ? { ...c, col: fallback.id, updated_at: now } : c)),
          );
          await supabase.from("tasks").update({ col: fallback.id, updated_at: now }).eq("col", id);
        } else {
          setCards((cur) => cur.filter((c) => c.col !== id));
          await supabase.from("tasks").delete().eq("col", id);
        }
        setColumns(remaining);
        await supabase.from("columns").delete().eq("id", id);
      },
    }),
    // IMPORTANTE: array de dependências IDÊNTICO ao original (verbatim).
    // As funções dos slices (logActivity, addComment, saveTemplate, ...) e os
    // refs são intencionalmente OMITIDOS: incluí-los recriaria este memo a cada
    // render (essas funções não são memoizadas nos hooks), anulando a divisão
    // value/fullValue que existe justamente para que mudanças em
    // activities/comments/timeLogs não recriem os closures do kernel. As ações
    // do kernel só leem entidades + estado de UI, que estão todos listados aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      cards,
      trilhas,
      tracks,
      columns,
      collapsed,
      search,
      filter,
      trackFilter,
      createOpen,
      loading,
      templates,
      cardColors,
    ],
  );

  const fullValue = useMemo(
    () => ({ ...value, activitiesByCard, commentsByCard, timeLogsByCard }),
    [value, activitiesByCard, commentsByCard, timeLogsByCard],
  );

  return <Ctx.Provider value={fullValue}>{children}</Ctx.Provider>;
}
