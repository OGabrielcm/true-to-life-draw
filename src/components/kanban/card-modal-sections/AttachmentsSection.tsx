import { useRef, useState } from "react";
import { Paperclip, Trash2, Download, FileText, Image } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Attachment, Card } from "@/lib/kanban-types";
import { useLocale } from "@/lib/locale-context";

const BUCKET = "attachments";
const MAX_MB = 20;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string) {
  return mime.startsWith("image/");
}

function AttachmentIcon({ mime }: { mime: string }) {
  return isImage(mime) ? (
    <Image className="h-4 w-4 shrink-0 text-muted-foreground" />
  ) : (
    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
  );
}

export function AttachmentsSection({
  card,
  onUpdate,
}: {
  card: Card;
  onUpdate: (id: string, patch: Partial<Card>) => void;
}) {
  const { t } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attachments = card.attachments ?? [];

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    const added: Attachment[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`${t("attachment_too_large")} (máx. ${MAX_MB}MB)`);
        continue;
      }
      const ext = file.name.split(".").pop() ?? "";
      const unique = `${crypto.randomUUID()}.${ext}`;
      const path = `${user.id}/${card.id}/${unique}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      added.push({
        id: crypto.randomUUID(),
        name: file.name,
        path,
        mime: file.type || "application/octet-stream",
        size: file.size,
        uploaded_at: new Date().toISOString(),
      });
    }

    if (added.length > 0) {
      onUpdate(card.id, { attachments: [...attachments, ...added] });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRemove = async (att: Attachment) => {
    await supabase.storage.from(BUCKET).remove([att.path]);
    onUpdate(card.id, { attachments: attachments.filter((a) => a.id !== att.id) });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "var(--font-display)" }}>
          {t("attachments")}
        </h3>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          style={{ borderWidth: "0.5px" }}
        >
          <Paperclip className="h-3.5 w-3.5" />
          {uploading ? t("uploading") : t("attach_file")}
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {attachments.length === 0 ? (
        <div
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center transition-colors hover:bg-muted/40"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="h-5 w-5 text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground">{t("no_attachments")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs"
              style={{ borderWidth: "0.5px" }}
            >
              <AttachmentIcon mime={att.mime} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-foreground">{att.name}</span>
                <span className="text-[10px] text-muted-foreground">{formatBytes(att.size)}</span>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={getPublicUrl(att.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={t("download")}
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(att)}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title={t("delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
