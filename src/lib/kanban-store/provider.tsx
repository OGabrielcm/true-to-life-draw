// Kernel do KanbanProvider: entidades (cards/tracks/trilhas/columns) +
// estado de UI (filter/trackFilter/collapsed/search/createOpen/loading) +
// efeito de load + TODAS as ações que tocam essas entidades. Mantido junto DE
// PROPÓSITO: as ações de delete cruzam domínios (deleteTrack mexe em cards/
// trackFilter/collapsed; deleteTrilha em cards/filter), então separá-las
// criaria acoplamento via setters injetados.
//
// ARQUITETURA (refatorado): as ações do kernel são memoizadas UMA vez (deps
// `[]`) e leem o estado SEMPRE fresco através de `stateRef`/`slicesRef`, em vez
// de capturá-lo por closure. Isso elimina o antigo array de dependências manual
// (com `eslint-disable`) que era o footgun real: adicionar uma ação que lê um
// novo pedaço de estado e esquecer de listá-lo dava closure obsoleta, bug
// silencioso, zero erro de compilação. Agora `value` só depende de DADOS
// reativos reais — sem `eslint-disable`, sem closure presa.
//
// Persistência isolada em kanban-repo.ts; lógica não-trivial (ordem do reorder,
// cascata de delete) em kanban-logic.ts (testada). Slices independentes
// (card-details, templates, card-colors) compostos via hooks.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Card, Column, Track, Trilha, loadCollapsed, saveCollapsed } from "../kanban-types";
import { useAuth } from "../auth-store";
import { Ctx, KanbanCtx } from "./context";
import {
  nextOrder,
  rowToCard,
  rowToColumn,
  rowToTrack,
  rowToTrilha,
  trackToRow,
} from "./kanban-mappers";
import { computeColumnDeletion, computeReorderOrder, computeTrackDeletion } from "./kanban-logic";
import { kanbanRepo } from "./kanban-repo";
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
    attachmentsByCard,
    currentUserIdRef,
    logActivity,
    loadCardDetails,
    addComment,
    updateComment,
    deleteComment,
    addTimeLog,
    deleteTimeLog,
    addAttachment,
    deleteAttachment,
  } = useCardDetails();
  const { templates, saveTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const { cardColors, setCardColor } = useCardColors();

  // Espelho SEMPRE fresco do estado e dos slices, para que as ações estáveis
  // (memo com deps `[]`) leiam sem capturar valores antigos por closure.
  // Atualizado a cada render — barato, sincronicamente correto na fase de render.
  const stateRef = useRef({ cards, trilhas, tracks, columns });
  stateRef.current = { cards, trilhas, tracks, columns };

  const slicesRef = useRef({
    logActivity,
    loadCardDetails,
    addComment,
    updateComment,
    deleteComment,
    addTimeLog,
    deleteTimeLog,
    addAttachment,
    deleteAttachment,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    setCardColor,
  });
  slicesRef.current = {
    logActivity,
    loadCardDetails,
    addComment,
    updateComment,
    deleteComment,
    addTimeLog,
    deleteTimeLog,
    addAttachment,
    deleteAttachment,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    setCardColor,
  };

  // Bloco 2.1: consome a sessão do auth-store em vez de manter getUser()/
  // onAuthStateChange próprios. O padrão anterior tinha 3 gatilhos de load
  // (chamada direta + SIGNED_IN + load inicial) correndo sobre um único
  // loadInFlightRef cujo dedup, sob StrictMode (mount→cleanup→mount), devolvia
  // uma Promise presa ao `cancelled` da instância morta → o board travava no
  // skeleton ao restaurar sessão (reload). O auth-store já usa getSession()
  // (leitura local, sem race) e expõe user/loading; este efeito reage a eles —
  // um único gatilho, igual ao padrão de user-profile-store.
  const { user, loading: authLoading } = useAuth();
  const loadInFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // Aguarda o auth-store hidratar a sessão antes de decidir.
    if (authLoading) return;

    // Sem usuário (sessão expirada/deslogado): limpa o estado e encerra o
    // loading — o guard do AppShell (!user && !loading) redireciona ao /login,
    // em vez de skeleton infinito e silencioso.
    if (!user) {
      setCards([]);
      setTrilhas([]);
      setTracks([]);
      setColumns([]);
      currentUserIdRef.current = null;
      loadInFlightRef.current = null;
      setLoading(false);
      return;
    }

    let cancelled = false;
    currentUserIdRef.current = user.id;

    const runLoad = async () => {
      // Sem seed automático: trilhas, tracks, columns e cards iniciais
      // são criadas pelo usuário no Onboarding Beta (e depois em /settings).
      const {
        cards: dbCards,
        trilhas: dbTrilhas,
        tracks: dbTracks,
        columns: dbColumns,
      } = await kanbanRepo.loadAll();

      if (cancelled) return;

      setTracks(dbTracks.map(rowToTrack));
      setCards(dbCards.map(rowToCard));
      setTrilhas(dbTrilhas.map(rowToTrilha));
      setColumns(dbColumns.map(rowToColumn).sort((a, b) => a.order - b.order));
      setLoading(false);
    };

    // Dedup de fetches concorrentes redundantes (StrictMode + re-render).
    if (!loadInFlightRef.current) {
      loadInFlightRef.current = runLoad().finally(() => {
        loadInFlightRef.current = null;
      });
    }

    return () => {
      cancelled = true;
    };
    // Depende de user?.id (primitivo estável), NÃO do objeto `user`: o auth-store
    // recria session?.user a cada setSession (INITIAL_SESSION → SIGNED_IN →
    // TOKEN_REFRESHED no reload). Chavear pelo objeto causaria re-runs espúrios
    // que cancelavam o load em voo e travavam o board no skeleton (Bloco 2.1).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  useEffect(() => {
    saveCollapsed(collapsed);
  }, [collapsed]);

  // Ações do kernel: memoizadas UMA vez. Leem estado/slices via refs (sempre
  // frescos), persistem via kanbanRepo, computam via kanban-logic. Por isso a
  // deps array é `[]` e estável — não há o que esquecer de listar.
  const actions = useMemo(
    () => ({
      addCard: async (data: Parameters<KanbanCtx["addCard"]>[0]) => {
        const userId = await kanbanRepo.getUserId();
        if (!userId) return;
        currentUserIdRef.current = userId;
        const { cards } = stateRef.current;
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
        const { data: inserted, error } = await kanbanRepo.tasks.insert(newCard, userId);
        if (error) {
          setCards((cur) => cur.filter((c) => c.id !== tempId));
        } else if (inserted) {
          const real = rowToCard(inserted);
          setCards((cur) => cur.map((c) => (c.id === tempId ? real : c)));
          slicesRef.current.logActivity(real.id, "created", `Card criado: "${real.title}"`);
        }
      },

      updateCard: async (id: string, patch: Partial<Card>) => {
        const now = new Date().toISOString();
        const before = stateRef.current.cards.find((c) => c.id === id);
        setCards((cur) => cur.map((c) => (c.id === id ? { ...c, ...patch, updated_at: now } : c)));
        const { error: updateError } = await kanbanRepo.tasks.update(id, {
          ...patch,
          updated_at: now,
        });
        if (updateError) {
          setCards((cur) => cur.map((c) => (c.id === id && before ? before : c)));
          console.error("[updateCard] Falha ao salvar no Supabase:", updateError);
          return;
        }
        if (before) {
          const logActivity = slicesRef.current.logActivity;
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

      moveCard: async (id: string, col: string, track?: string) => {
        const now = new Date().toISOString();
        const { cards, columns } = stateRef.current;
        const before = cards.find((c) => c.id === id);
        const targetTrack = track ?? before?.track;
        if (!targetTrack) return;
        // Card que muda de coluna/track vai pro final da nova coluna.
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
        const { error: moveError } = await kanbanRepo.tasks.update(id, patch);
        if (moveError) {
          // Rollback optimistic update.
          setCards((cur) => cur.map((c) => (c.id === id && before ? before : c)));
          console.error("[moveCard] Falha ao salvar no Supabase:", moveError);
          return;
        }
        if (before && before.col !== col) {
          const fromName = columns.find((c) => c.id === before.col)?.name ?? before.col;
          const toName = columns.find((c) => c.id === col)?.name ?? col;
          slicesRef.current.logActivity(id, "moved", `Movido: ${fromName} → ${toName}`);
        }
      },

      reorderCard: async (id: string, target: Parameters<KanbanCtx["reorderCard"]>[1]) => {
        const { cards } = stateRef.current;
        const result = computeReorderOrder(cards, id, target);
        if (!result) return;
        const card = cards.find((c) => c.id === id);
        if (!card) return;

        const now = new Date().toISOString();
        const snapshot = card;
        setCards((cur) =>
          cur.map((c) =>
            c.id === id
              ? { ...c, col: result.col, track: result.track, order: result.order, updated_at: now }
              : c,
          ),
        );
        const { error: reorderError } = await kanbanRepo.tasks.update(id, {
          col: result.col,
          track: result.track,
          order: result.order,
          updated_at: now,
        });
        if (reorderError) {
          // Rollback optimistic update.
          setCards((cur) => cur.map((c) => (c.id === id ? snapshot : c)));
          console.error("[reorderCard] Falha ao salvar no Supabase:", reorderError);
        }
      },

      deleteCard: async (id: string) => {
        setCards((cur) => cur.filter((c) => c.id !== id));
        await kanbanRepo.tasks.remove(id);
      },

      toggleStar: async (id: string) => {
        const now = new Date().toISOString();
        const card = stateRef.current.cards.find((c) => c.id === id);
        setCards((cur) =>
          cur.map((c) => (c.id === id ? { ...c, starred: !c.starred, updated_at: now } : c)),
        );
        if (card) {
          await kanbanRepo.tasks.update(id, { starred: !card.starred, updated_at: now });
          slicesRef.current.logActivity(
            id,
            card.starred ? "unstarred" : "starred",
            card.starred ? "Removido dos favoritos" : "Marcado como favorito",
          );
        }
      },

      duplicateCard: async (id: string) => {
        const userId = await kanbanRepo.getUserId();
        const original = stateRef.current.cards.find((c) => c.id === id);
        if (!userId || !original) return;
        const now = new Date().toISOString();
        const tempId = crypto.randomUUID();
        const newCard: Card = {
          ...original,
          id: tempId,
          title: `${original.title} (copy)`,
          starred: false,
          order: nextOrder(stateRef.current.cards, original.track, original.col),
          // Reseta estado de progresso: checklist desmarcado, sem dependências.
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
        const { data: inserted, error } = await kanbanRepo.tasks.insert(newCard, userId);
        if (error) {
          setCards((cur) => cur.filter((c) => c.id !== tempId));
        } else if (inserted) {
          const real = rowToCard(inserted);
          setCards((cur) => cur.map((c) => (c.id === tempId ? real : c)));
          slicesRef.current.logActivity(real.id, "duplicated", `Duplicado de "${original.title}"`);
        }
      },

      toggleCollapsed: (id: string) => setCollapsed((cur) => ({ ...cur, [id]: !cur[id] })),

      getColumnsForTrack: (trackId: string) => {
        const { columns } = stateRef.current;
        const trackCols = columns.filter((c) => c.track_id === trackId);
        if (trackCols.length > 0) return trackCols.sort((a, b) => a.order - b.order);
        return columns.filter((c) => !c.track_id).sort((a, b) => a.order - b.order);
      },

      createTrilha: async (t: Omit<Trilha, "id">) => {
        const userId = await kanbanRepo.getUserId();
        if (!userId) return;
        const tempId = crypto.randomUUID();
        setTrilhas((cur) => [...cur, { ...t, id: tempId }]);
        const { data: inserted, error } = await kanbanRepo.trilhas.insert(t, userId);
        if (error) {
          setTrilhas((cur) => cur.filter((x) => x.id !== tempId));
        } else if (inserted) {
          setTrilhas((cur) => cur.map((x) => (x.id === tempId ? rowToTrilha(inserted) : x)));
        }
      },

      updateTrilha: async (id: string, data: Omit<Trilha, "id">) => {
        setTrilhas((cur) => cur.map((t) => (t.id === id ? { ...t, ...data } : t)));
        await kanbanRepo.trilhas.update(id, data);
      },

      deleteTrilha: async (id: string) => {
        setTrilhas((cur) => cur.filter((t) => t.id !== id));
        setCards((cur) => cur.map((c) => ({ ...c, tags: c.tags.filter((x) => x !== id) })));
        setFilter((f) => (f === id ? "__all" : f));
        await kanbanRepo.trilhas.remove(id);
        await kanbanRepo.trilhas.removeTagFromTasks(id);
      },

      createTrack: async (input: Parameters<KanbanCtx["createTrack"]>[0]) => {
        const userId = await kanbanRepo.getUserId();
        if (!userId) return;
        const { tracks } = stateRef.current;
        const tempId = crypto.randomUUID();
        const order =
          input.order ?? (tracks.length ? Math.max(...tracks.map((t) => t.order)) + 1 : 0);
        const newTrack: Track = { ...input, id: tempId, order };
        setTracks((cur) => [...cur, newTrack].sort((a, b) => a.order - b.order));
        const { data: inserted, error } = await kanbanRepo.tracks.insert(
          trackToRow(newTrack),
          userId,
        );
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

      updateTrack: async (id: string, data: Omit<Track, "id">) => {
        setTracks((cur) =>
          cur.map((t) => (t.id === id ? { ...t, ...data } : t)).sort((a, b) => a.order - b.order),
        );
        await kanbanRepo.tracks.update(id, data);
      },

      deleteTrack: async (id: string) => {
        const { cards, tracks } = stateRef.current;
        const now = new Date().toISOString();
        const result = computeTrackDeletion(cards, tracks, id, now);
        setCards(result.cards);
        setTracks(result.remaining);
        setTrackFilter((f) => (f === id ? "__all" : f));
        setCollapsed((cur) => {
          const next = { ...cur };
          delete next[id];
          return next;
        });
        if (result.fallbackId) {
          await kanbanRepo.tasks.reassignTrack(id, result.fallbackId, now);
        } else {
          await kanbanRepo.tasks.deleteByTrack(id);
        }
        await kanbanRepo.tracks.remove(id);
      },

      createColumn: async (name: string, trackId?: string) => {
        const userId = await kanbanRepo.getUserId();
        if (!userId) return;
        const { columns } = stateRef.current;
        const tempId = crypto.randomUUID();
        const scopedCols = trackId
          ? columns.filter((c) => c.track_id === trackId)
          : columns.filter((c) => !c.track_id);
        const order = scopedCols.length ? Math.max(...scopedCols.map((c) => c.order)) + 1 : 5;
        const newCol: Column = { id: tempId, name: name.trim(), order, track_id: trackId };
        setColumns((cur) => [...cur, newCol].sort((a, b) => a.order - b.order));
        const { data: inserted, error } = await kanbanRepo.columns.insert({
          id: tempId,
          name: name.trim(),
          order,
          user_id: userId,
          track_id: trackId ?? null,
        });
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

      updateColumn: async (id: string, data: { name?: string; wip_limit?: number | null }) => {
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
        await kanbanRepo.columns.update(id, patch);
      },

      deleteColumn: async (id: string) => {
        const { cards, columns } = stateRef.current;
        const now = new Date().toISOString();
        const result = computeColumnDeletion(cards, columns, id, now);
        setCards(result.cards);
        setColumns(result.remaining);
        if (result.fallbackId) {
          await kanbanRepo.tasks.reassignColumn(id, result.fallbackId, now);
        } else {
          await kanbanRepo.tasks.deleteByColumn(id);
        }
        await kanbanRepo.columns.remove(id);
      },

      // Pass-throughs estáveis para os slices (delegam via ref → sempre frescos).
      saveTemplate: (card: Card, name: string) => slicesRef.current.saveTemplate(card, name),
      updateTemplate: (templateId: string, name: string) =>
        slicesRef.current.updateTemplate(templateId, name),
      deleteTemplate: (templateId: string) => slicesRef.current.deleteTemplate(templateId),
      setCardColor: (cardId: string, color: string) =>
        slicesRef.current.setCardColor(cardId, color),
      loadCardDetails: (cardId: string) => slicesRef.current.loadCardDetails(cardId),
      addComment: (cardId: string, text: string) => slicesRef.current.addComment(cardId, text),
      updateComment: (commentId: string, text: string) =>
        slicesRef.current.updateComment(commentId, text),
      deleteComment: (commentId: string, cardId: string) =>
        slicesRef.current.deleteComment(commentId, cardId),
      addTimeLog: (cardId: string, minutes: number, note?: string, loggedAt?: string) =>
        slicesRef.current.addTimeLog(cardId, minutes, note, loggedAt),
      deleteTimeLog: (logId: string, cardId: string) =>
        slicesRef.current.deleteTimeLog(logId, cardId),
      addAttachment: (cardId: string, file: File) => slicesRef.current.addAttachment(cardId, file),
      deleteAttachment: (attachment: Parameters<KanbanCtx["deleteAttachment"]>[0]) =>
        slicesRef.current.deleteAttachment(attachment),
    }),
    // Deps `[]` PROPOSITAIS: as ações leem tudo via stateRef/slicesRef, então
    // são estáveis para sempre. currentUserIdRef é um ref (estável). Não há
    // valor reativo capturado aqui — nada a listar, nada a esquecer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // `value` agrega DADOS reativos + setters (estáveis) + ações (estáveis).
  // Recria quando algum dado muda — que é exatamente quando os consumidores
  // precisam ver a mudança. Todas as deps são valores reativos reais: o
  // footgun do array manual desapareceu (sem closure de ação capturada aqui).
  const value = useMemo<KanbanCtx>(
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
      activitiesByCard,
      commentsByCard,
      timeLogsByCard,
      attachmentsByCard,
      ...actions,
    }),
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
      activitiesByCard,
      commentsByCard,
      timeLogsByCard,
      attachmentsByCard,
      actions,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
