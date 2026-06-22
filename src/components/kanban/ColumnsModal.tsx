import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Column } from "@/lib/kanban-types";
import { useLocale } from "@/lib/locale-context";

export function ColumnsModal({
  columns,
  trackId,
  trackName,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: {
  columns: Column[];
  trackId?: string;
  trackName?: string;
  onClose: () => void;
  onCreate: (name: string, trackId?: string) => void;
  onUpdate: (id: string, data: { name?: string; wip_limit?: number | null }) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWipLimit, setEditWipLimit] = useState<string>("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const startEdit = (col: Column) => {
    setEditingId(col.id);
    setEditName(col.name);
    setEditWipLimit(col.wip_limit ? String(col.wip_limit) : "");
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    const wip = editWipLimit.trim() ? parseInt(editWipLimit.trim(), 10) : null;
    onUpdate(editingId, { name: editName.trim(), wip_limit: wip });
    setEditingId(null);
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreate(newName.trim(), trackId);
    setNewName("");
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-card p-5 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-base font-medium text-foreground">
          {trackName ? `${t("manage_columns")} · ${trackName}` : t("manage_columns")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {trackId ? t("manage_columns_track_desc") : t("manage_columns_desc")}
        </p>

        <div className="mt-4 space-y-2">
          {columns.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("no_columns_yet")}</p>
          )}
          {columns.map((col) => {
            const isEditing = editingId === col.id;
            const isConfirming = confirmId === col.id;
            return (
              <div
                key={col.id}
                className="flex items-center gap-2 rounded-lg border bg-background p-2.5"
                style={{ borderWidth: "0.5px" }}
              >
                {isEditing ? (
                  <>
                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        className="rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
                        style={{ borderWidth: "0.5px" }}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">
                          {t("wip_limit")}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={editWipLimit}
                          onChange={(e) => setEditWipLimit(e.target.value)}
                          placeholder={t("wip_no_limit")}
                          className="flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
                          style={{ borderWidth: "0.5px" }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={saveEdit}
                      className="rounded-md p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 shrink-0"
                      aria-label={t("save")}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted shrink-0"
                      aria-label={t("cancel")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">{col.name}</span>
                      {col.wip_limit && (
                        <div className="text-xs text-muted-foreground">
                          {t("wip_short")} {col.wip_limit}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isConfirming ? (
                        <>
                          <span className="text-xs text-muted-foreground">
                            {t("delete_confirm")}
                          </span>
                          <button
                            onClick={() => {
                              onDelete(col.id);
                              setConfirmId(null);
                            }}
                            className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            {t("yes")}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                          >
                            {t("no")}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(col)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={t("edit")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmId(col.id)}
                            disabled={columns.length <= 1}
                            className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-950/30"
                            aria-label={t("delete")}
                            title={columns.length <= 1 ? t("min_one_column") : undefined}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <form
          onSubmit={create}
          className="mt-4 rounded-lg border bg-muted/40 p-3"
          style={{ borderWidth: "0.5px" }}
        >
          <p className="text-xs font-medium text-muted-foreground">{t("new_column")}</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("column_name_placeholder")}
              className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px" }}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("create")}
            </button>
          </div>
        </form>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
