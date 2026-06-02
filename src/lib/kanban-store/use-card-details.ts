// Slice de detalhes do card: activities, comments e time logs.
// Estado e ações extraídos verbatim de kanban-store.tsx. Expõe também a
// infraestrutura de logActivity (ref + currentUserIdRef), pois o log de
// atividade escreve em activitiesByCard mas é disparado pelas ações do kernel.
import { useRef, useState } from "react";
import { Activity, ActivityType, Attachment, Comment, TimeLog } from "../kanban-types";
import * as ActivityService from "../activity-service";
import * as CommentsService from "../comments-service";
import * as TimelogService from "../timelog-service";
import * as AttachmentsService from "../attachments-service";
import { supabase } from "../supabase";

export function useCardDetails() {
  const [activitiesByCard, setActivitiesByCard] = useState<Record<string, Activity[]>>({});
  const [commentsByCard, setCommentsByCard] = useState<Record<string, Comment[]>>({});
  const [timeLogsByCard, setTimeLogsByCard] = useState<Record<string, TimeLog[]>>({});
  const [attachmentsByCard, setAttachmentsByCard] = useState<Record<string, Attachment[]>>({});

  // currentUserIdRef é compartilhado entre o log de atividade e o load do
  // kernel — mantido junto do logActivity (sua única dependência aqui).
  const currentUserIdRef = useRef<string | null>(null);

  const logActivityRef = useRef<
    (taskId: string, type: ActivityType, message: string) => Promise<void>
  >(async () => {});

  const logActivityFn = async (taskId: string, type: ActivityType, message: string) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    await ActivityService.logActivity(setActivitiesByCard, userId, taskId, type, message);
  };

  logActivityRef.current = logActivityFn;
  const logActivity = (taskId: string, type: ActivityType, message: string) =>
    logActivityRef.current(taskId, type, message);

  const loadCardDetails = async (cardId: string) => {
    const [acts, cmts, logs, atts] = await Promise.all([
      ActivityService.fetchActivities(cardId),
      CommentsService.fetchComments(cardId),
      TimelogService.fetchTimeLogs(cardId),
      AttachmentsService.fetchAttachments(cardId),
    ]);
    setActivitiesByCard((cur) => ({ ...cur, [cardId]: acts }));
    setCommentsByCard((cur) => ({ ...cur, [cardId]: cmts }));
    setTimeLogsByCard((cur) => ({ ...cur, [cardId]: logs }));
    setAttachmentsByCard((cur) => ({ ...cur, [cardId]: atts }));
  };

  const addComment = async (cardId: string, text: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await CommentsService.addComment(setCommentsByCard, user.id, cardId, text);
  };

  const updateComment = async (commentId: string, text: string) => {
    await CommentsService.updateComment(setCommentsByCard, commentId, text);
  };

  const deleteComment = async (commentId: string, cardId: string) => {
    await CommentsService.deleteComment(setCommentsByCard, commentId, cardId);
  };

  const addTimeLog = async (cardId: string, minutes: number, note?: string, loggedAt?: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await TimelogService.addTimeLog(setTimeLogsByCard, user.id, cardId, minutes, note, loggedAt);
  };

  const deleteTimeLog = async (logId: string, cardId: string) => {
    await TimelogService.deleteTimeLog(setTimeLogsByCard, logId, cardId);
  };

  const addAttachment = async (cardId: string, file: File) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await AttachmentsService.addAttachment(setAttachmentsByCard, user.id, cardId, file);
  };

  const deleteAttachment = async (attachment: Attachment) => {
    await AttachmentsService.deleteAttachment(setAttachmentsByCard, attachment);
  };

  return {
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
  };
}
