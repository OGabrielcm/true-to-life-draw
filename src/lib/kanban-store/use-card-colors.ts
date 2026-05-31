// Slice de cores de destaque por card. Estado, ação e efeito de persistência
// extraídos verbatim de kanban-store.tsx.
import { useEffect, useState } from "react";
import { loadCardColors, saveCardColors } from "../kanban-types";

export function useCardColors() {
  const [cardColors, setCardColors] = useState<Record<string, string>>(loadCardColors);

  useEffect(() => {
    saveCardColors(cardColors);
  }, [cardColors]);

  const setCardColor = (cardId: string, color: string) => {
    setCardColors((cur) => {
      const next = { ...cur };
      if (color === "none") {
        delete next[cardId];
      } else {
        next[cardId] = color;
      }
      return next;
    });
  };

  return { cardColors, setCardColor };
}
