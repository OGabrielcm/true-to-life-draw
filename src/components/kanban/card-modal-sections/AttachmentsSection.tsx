import { useRef, useState } from "react";
import { Paperclip, Trash2, Download, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useKanban } from "@/lib/kanban-store";
import { useLocale } from "@/lib/locale-context";
import { formatBytes } from "@/lib/kanban-types";
import { attachmentPublicUrl } from "@/lib/attachments-service";

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20 MB

function isImage(mime?: string) {
  return !!mime && mime.startsWith("image/");
}

export function AttachmentsSection({ cardId }: { cardId: string }) {
  const { attachmentsByCard, addAttachment, deleteAttachment } = useKanban();
  const { t, locale } = useLocale();
  const attachments = attachmentsByCard[cardId] ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`"${file.name}" ${t("attach_too_large")}`);
        continue;
      }
      await addAttachment(cardId, file);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mt-5">
      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Paperclip className="h-3 w-3" />
        {t("tab_attachments")} {attachments.length > 0 && `(${attachments.length})`}
      </p>

      <div className="space-y-1.5">
        {attachments.length === 0 && (
          <p className="rounded-md border border-dashed px-2.5 py-3 text-center text-xs text-muted-foreground">
            {t("attach_empty")}
          </p>
        )}

        {attachments.map((a) => {
          const url = attachmentPublicUrl(a.path);
          return (
            <div
              key={a.id}
              className="group flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5"
            >
              {isImage(a.mime) ? (
                <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
                  <img
                    src={url}
                    alt={a.name}
                    className="h-9 w-9 rounded object-cover"
                    loading="lazy"
                  />
                </a>
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm text-foreground hover:underline"
                  title={a.name}
                >
                  {a.name}
                </a>
                <p className="text-[10px] text-muted-foreground">
                  {formatBytes(a.size_bytes)}
                  {a.size_bytes ? " · " : ""}
                  {new Date(a.created_at).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US")}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <a
                  href={url}
                  download={a.name}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("attach_download")}
                  className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground md:h-7 md:w-7"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                {/* Excluir sempre visível no mobile (sem hover); fade só no desktop (lição 3.2). */}
                <button
                  onClick={() => deleteAttachment(a)}
                  aria-label={t("attach_delete")}
                  className="flex h-9 w-9 items-center justify-center rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 md:h-7 md:w-7 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Paperclip className="h-3.5 w-3.5" />
        )}
        {uploading ? t("attach_uploading") : t("attach_add")}
      </button>
    </div>
  );
}
