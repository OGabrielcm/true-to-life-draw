// Entrypoint estável do store Kanban. Consumidores continuam importando
// `KanbanProvider` e `useKanban` de "@/lib/kanban-store" sem alteração.
//
// O store foi dividido (Bloco 1.5) em:
//   - kanban-mappers.ts  → helpers puros row↔modelo
//   - context.ts         → KanbanCtx, AddInput, createContext, useKanban
//   - use-card-details.ts→ activities/comments/timeLogs + logActivity
//   - use-templates.ts   → templates de card
//   - use-card-colors.ts → cores de destaque
//   - provider.tsx       → kernel (entidades + UI acoplada + ações)
export { KanbanProvider } from "./provider";
export { useKanban } from "./context";
export type { KanbanCtx, AddInput } from "./context";
