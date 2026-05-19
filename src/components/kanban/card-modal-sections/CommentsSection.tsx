import { useState } from "react";
import { Check, X, Pencil, Plus, Trash2, MessageSquare } from "lucide-react";
import { useKanban } from "@/lib/kanban-store";
import { useLocale } from "@/lib/locale-context";

export function CommentsSection({ cardId }: { cardId: string }) {
  const { commentsByCard, addComment, updateComment, deleteComment } = useKanban();
  const { t, locale } = useLocale();
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
        {t("comments")} {comments.length > 0 && `(${comments.length})`}
      </p>

      <div className="space-y-1.5">
        {comments.map((c) => (
          <div key={c.id} className="group rounded-md border bg-background px-2.5 py-1.5">
            {editingId === c.id ? (
              <div className="flex items-start gap-1.5">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  className="flex-1 resize-none rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
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
                  {new Date(c.created_at).toLocaleString(locale === "pt" ? "pt-BR" : "en-US")}
                  {c.updated_at !== c.created_at && ` ${t("comment_edited")}`}
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
          placeholder={t("comment_placeholder")}
          rows={2}
          className="flex-1 resize-none rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
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
