import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { TRILHA_COLOR_PRESETS, Trilha } from "@/lib/kanban-types";
import { useLocale } from "@/lib/locale-context";

function ColorPicker({
  value,
  onChange,
}: {
  value: { bg: string; fg: string };
  onChange: (c: { bg: string; fg: string }) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap gap-1.5">
      {TRILHA_COLOR_PRESETS.map((c) => {
        const active = c.bg === value.bg && c.fg === value.fg;
        return (
          <button
            key={c.bg}
            type="button"
            onClick={() => onChange(c)}
            className="h-6 w-6 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: c.bg,
              outline: active ? `2px solid ${c.fg}` : "2px solid transparent",
              outlineOffset: "2px",
            }}
            aria-label={t("color")}
          />
        );
      })}
    </div>
  );
}

export function TrilhasModal({
  trilhas,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: {
  trilhas: Trilha[];
  onClose: () => void;
  onCreate: (t: Omit<Trilha, "id">) => void;
  onUpdate: (id: string, t: Omit<Trilha, "id">) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(TRILHA_COLOR_PRESETS[0]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TRILHA_COLOR_PRESETS[0]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const startEdit = (trilha: Trilha) => {
    setEditingId(trilha.id);
    setEditName(trilha.name);
    setEditColor({ bg: trilha.bg, fg: trilha.fg });
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    onUpdate(editingId, { name: editName.trim(), ...editColor });
    setEditingId(null);
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreate({ name: newName.trim(), ...newColor });
    setNewName("");
    setNewColor(TRILHA_COLOR_PRESETS[0]);
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-card p-5 shadow-xl"
      >
        <h2 className="text-base font-medium text-foreground">{t("manage_tags")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("manage_tags_desc")}</p>

        <div className="mt-4 space-y-2">
          {trilhas.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("no_tags_yet")}</p>
          )}
          {trilhas.map((trilha) => {
            const isEditing = editingId === trilha.id;
            const isConfirming = confirmId === trilha.id;
            return (
              <div
                key={trilha.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2.5"
                style={{ borderWidth: "0.5px" }}
              >
                {isEditing ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
                      style={{ borderWidth: "0.5px" }}
                      autoFocus
                    />
                    <ColorPicker value={editColor} onChange={setEditColor} />
                    <button
                      onClick={saveEdit}
                      className="rounded-md p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                      aria-label={t("save")}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label={t("cancel")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: trilha.bg, color: trilha.fg }}
                    >
                      {trilha.name}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      {isConfirming ? (
                        <>
                          <span className="text-xs text-muted-foreground">{t("delete_confirm")}</span>
                          <button
                            onClick={() => {
                              onDelete(trilha.id);
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
                            onClick={() => startEdit(trilha)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={t("edit")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmId(trilha.id)}
                            className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            aria-label={t("delete")}
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
          <p className="text-xs font-medium text-muted-foreground">{t("new_tag")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("tag_name_placeholder")}
              className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px", minWidth: "140px" }}
            />
            <ColorPicker value={newColor} onChange={setNewColor} />
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
