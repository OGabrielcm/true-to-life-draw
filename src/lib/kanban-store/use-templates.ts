// Slice de templates de card. Estado, ações e efeito de persistência
// extraídos verbatim de kanban-store.tsx.
import { useEffect, useState } from "react";
import { Card, CardTemplate, loadTemplates, saveTemplates } from "../kanban-types";

export function useTemplates() {
  const [templates, setTemplates] = useState<CardTemplate[]>(loadTemplates);

  useEffect(() => {
    saveTemplates(templates);
  }, [templates]);

  const saveTemplate = (card: Card, name: string) => {
    const tpl: CardTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type: card.type,
      prio: card.prio,
      desc: card.desc,
      tags: card.tags,
      checklist: (card.checklist ?? []).map((i) => ({
        ...i,
        id: crypto.randomUUID(),
        done: false,
      })),
      created_at: new Date().toISOString(),
    };
    setTemplates((cur) => [...cur, tpl]);
  };

  const updateTemplate = (id: string, name: string) => {
    setTemplates((cur) => cur.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)));
  };

  const deleteTemplate = (id: string) => {
    setTemplates((cur) => cur.filter((t) => t.id !== id));
  };

  return { templates, saveTemplate, updateTemplate, deleteTemplate };
}
