// Ponto de entrada único para regras de negócio de cards.
// Importar daqui em vez de kanban-types para separar domínio de dados de lógica.
export {
  getDeadlineStatus,
  isArchived,
  isBlocked,
  getGoalProgress,
  getChecklistProgress,
  getCardAging,
} from "./kanban-types";
export type { DeadlineStatus } from "./kanban-types";
