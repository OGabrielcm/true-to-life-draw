import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { TRACK_COLOR_PRESETS, Track, TrackColorPreset } from "@/lib/kanban-types";
import { useTheme } from "@/components/theme-provider";
import { useLocale } from "@/lib/locale-context";

function findPreset(track: { bg: string; border: string; fg: string }): TrackColorPreset {
  return (
    TRACK_COLOR_PRESETS.find(
      (p) => p.bg === track.bg && p.border === track.border && p.fg === track.fg,
    ) ?? TRACK_COLOR_PRESETS[0]
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: TrackColorPreset;
  onChange: (c: TrackColorPreset) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TRACK_COLOR_PRESETS.map((c) => {
        const active = c.bg === value.bg && c.border === value.border;
        return (
          <button
            key={c.name}
            type="button"
            onClick={() => onChange(c)}
            className="h-6 w-6 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: c.darkBg,
              outline: active ? `2px solid ${c.border}` : "2px solid transparent",
              outlineOffset: "2px",
            }}
            title={c.name}
            aria-label={c.name}
          />
        );
      })}
    </div>
  );
}

export function TracksModal({
  tracks,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: {
  tracks: Track[];
  onClose: () => void;
  onCreate: (t: Omit<Track, "id" | "order">) => void;
  onUpdate: (id: string, t: Omit<Track, "id">) => void;
  onDelete: (id: string) => void;
}) {
  const { theme } = useTheme();
  const { t } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPreset, setEditPreset] = useState<TrackColorPreset>(TRACK_COLOR_PRESETS[0]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newPreset, setNewPreset] = useState<TrackColorPreset>(TRACK_COLOR_PRESETS[0]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const startEdit = (track: Track) => {
    setEditingId(track.id);
    setEditName(track.name);
    setEditPreset(findPreset(track));
  };

  const saveEdit = (current: Track) => {
    if (!editingId || !editName.trim()) return;
    onUpdate(editingId, {
      name: editName.trim(),
      bg: editPreset.bg,
      border: editPreset.border,
      fg: editPreset.fg,
      darkBg: editPreset.darkBg,
      darkFg: editPreset.darkFg,
      order: current.order,
    });
    setEditingId(null);
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreate({
      name: newName.trim(),
      bg: newPreset.bg,
      border: newPreset.border,
      fg: newPreset.fg,
      darkBg: newPreset.darkBg,
      darkFg: newPreset.darkFg,
    });
    setNewName("");
    setNewPreset(TRACK_COLOR_PRESETS[0]);
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-card p-5 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-base font-medium text-foreground">{t("manage_tracks")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("manage_tracks_desc")}</p>

        <div className="mt-4 space-y-2">
          {tracks.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("no_tracks_yet")}</p>
          )}
          {tracks.map((track) => {
            const isEditing = editingId === track.id;
            const isConfirming = confirmId === track.id;
            const bg = theme === "dark" ? track.darkBg : track.bg;
            const fg = theme === "dark" ? track.darkFg : track.fg;
            return (
              <div
                key={track.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2.5"
                style={{ borderWidth: "0.5px", borderLeft: `3px solid ${track.border}` }}
              >
                {isEditing ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
                      style={{ borderWidth: "0.5px", minWidth: "120px" }}
                      autoFocus
                    />
                    <ColorPicker value={editPreset} onChange={setEditPreset} />
                    <button
                      onClick={() => saveEdit(track)}
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
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: bg, color: fg }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: track.border }}
                      />
                      {track.name}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      {isConfirming ? (
                        <>
                          <span className="text-xs text-muted-foreground">{t("delete_confirm")}</span>
                          <button
                            onClick={() => {
                              onDelete(track.id);
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
                            onClick={() => startEdit(track)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={t("edit")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmId(track.id)}
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
          <p className="text-xs font-medium text-muted-foreground">{t("new_track")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("track_name_placeholder")}
              className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:border-foreground/40"
              style={{ borderWidth: "0.5px", minWidth: "140px" }}
            />
            <ColorPicker value={newPreset} onChange={setNewPreset} />
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
