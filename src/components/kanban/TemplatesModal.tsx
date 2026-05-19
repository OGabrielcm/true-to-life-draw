import { useState } from "react";
import { X, Pencil, Trash2, Check } from "lucide-react";
import { useKanban } from "@/lib/kanban-store";
import { CardTemplate } from "@/lib/kanban-types";
import { useLocale } from "@/lib/locale-context";

export function TemplatesModal({ onClose }: { onClose: () => void }) {
  const { templates, updateTemplate, deleteTemplate } = useKanban();
  const { t } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEdit = (tpl: CardTemplate) => {
    setEditingId(tpl.id);
    setEditName(tpl.name);
  };

  const commitEdit = () => {
    if (editingId && editName.trim()) {
      updateTemplate(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-card p-5 shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-foreground">{t("saved_templates")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {templates.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("no_templates")}
            <br />
            {t("no_templates_hint")}
          </p>
        ) : (
          <ul className="overflow-y-auto space-y-2">
            {templates.map((tpl) => (
              <li
                key={tpl.id}
                className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5"
                style={{ borderWidth: "0.5px" }}
              >
                <div className="flex-1 min-w-0">
                  {editingId === tpl.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full rounded border bg-background px-2 py-1 text-sm outline-none focus:border-foreground/40"
                      style={{ borderWidth: "0.5px" }}
                    />
                  ) : (
                    <div>
                      <p className="truncate text-sm font-medium text-foreground">{tpl.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {tpl.type} · {tpl.prio}
                        {tpl.checklist.length > 0 && ` · ${tpl.checklist.length} itens`}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {editingId === tpl.id ? (
                    <button
                      onClick={commitEdit}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(tpl)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`${t("delete_confirm")} "${tpl.name}"?`)) deleteTemplate(tpl.id);
                    }}
                    className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
