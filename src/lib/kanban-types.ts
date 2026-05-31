// ─────────────────────────────────────────────────────────────────────────────
// DECISÃO DE NOMENCLATURA — Track vs Trilha (não fundir os dois!)
//
// O projeto tem DOIS conceitos distintos que, no PT-BR visível ao usuário,
// ambos aparecem como "Trilhas". No CÓDIGO eles permanecem separados:
//
//   • Track  → swimlane horizontal do board (uma lane). Tem colunas próprias,
//              ordem, cores claras/escuras. Gerenciado por TracksModal.
//   • Trilha → tag/etiqueta de filtro (sistema de tags legado). Aparece em
//              Card.tags como lista de ids. Gerenciada por TrilhasModal.
//
// Padrão de UI: rótulos visíveis usam "Trilha(s)" (ver i18n.ts). Padrão de
// código: mantém-se `track`/`Track` para swimlane e `trilha`/`Trilha` para tag.
// NÃO renomear um no outro — fundiria swimlane e tag e quebraria board/filtros.
// ─────────────────────────────────────────────────────────────────────────────

export type ColumnId = string;
export type Priority = "Alta" | "Média" | "Baixa";
export type TrackId = string;
export type TaskType = "Task" | "Goal";

export interface Trilha {
  id: string;
  name: string;
  bg: string;
  fg: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Card {
  id: string;
  col: ColumnId;
  track: TrackId;
  type: TaskType;
  parent_id?: string;
  title: string;
  desc?: string;
  prio: Priority;
  date?: string;
  starred: boolean;
  tags: string[]; // trilha ids (legacy filter system)
  order: number; // ordem dentro da coluna (float, permite inserir entre cards sem renumerar)
  checklist: ChecklistItem[];
  blocked_by: string[]; // ids de cards que bloqueiam este card
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: ColumnId;
  name: string;
  order: number;
  wip_limit?: number; // undefined = sem limite
  track_id?: string;  // undefined = coluna global (template)
}

// IDs fixos para backwards compatibility com cards existentes
export const DEFAULT_COLUMNS: Column[] = [
  { id: "backlog", name: "Backlog", order: 0 },
  { id: "todo", name: "To Do", order: 1 },
  { id: "inprogress", name: "In Progress", order: 2 },
  { id: "review", name: "Review", order: 3 },
  { id: "done", name: "Done", order: 4 },
];

export const PRIORITIES: Priority[] = ["Alta", "Média", "Baixa"];

export const PRIO_COLORS: Record<
  Priority,
  { bg: string; fg: string; darkBg: string; darkFg: string }
> = {
  Alta: { bg: "#FCEBEB", fg: "#791F1F", darkBg: "#501313", darkFg: "#F09595" },
  Média: { bg: "#FAEEDA", fg: "#633806", darkBg: "#412402", darkFg: "#FAC775" },
  Baixa: { bg: "#EAF3DE", fg: "#27500A", darkBg: "#173404", darkFg: "#97C459" },
};

export interface Track {
  id: TrackId;
  name: string;
  bg: string;
  border: string;
  fg: string;
  darkBg: string;
  darkFg: string;
  order: number;
}

// Preset de cores: cada preset define todas as 5 variantes de cor de uma vez.
export interface TrackColorPreset {
  name: string;
  bg: string;
  border: string;
  fg: string;
  darkBg: string;
  darkFg: string;
}

export const TRACK_COLOR_PRESETS: TrackColorPreset[] = [
  {
    name: "Roxo",
    bg: "#EEEDFE",
    border: "#7F77DD",
    fg: "#3C3489",
    darkBg: "#26215C",
    darkFg: "#AFA9EC",
  },
  {
    name: "Verde",
    bg: "#E1F5EE",
    border: "#1D9E75",
    fg: "#085041",
    darkBg: "#04342C",
    darkFg: "#5DCAA5",
  },
  {
    name: "Laranja",
    bg: "#FAEEDA",
    border: "#EF9F27",
    fg: "#633806",
    darkBg: "#412402",
    darkFg: "#FAC775",
  },
  {
    name: "Azul",
    bg: "#E6F1FB",
    border: "#3B82F6",
    fg: "#0C447C",
    darkBg: "#0A2540",
    darkFg: "#7AB6F0",
  },
  {
    name: "Vermelho",
    bg: "#FCEBEB",
    border: "#DC2626",
    fg: "#791F1F",
    darkBg: "#501313",
    darkFg: "#F09595",
  },
  {
    name: "Verde-claro",
    bg: "#EAF3DE",
    border: "#65A30D",
    fg: "#27500A",
    darkBg: "#173404",
    darkFg: "#97C459",
  },
  {
    name: "Rosa",
    bg: "#FDE6F3",
    border: "#DB2777",
    fg: "#7A1D55",
    darkBg: "#4A0E33",
    darkFg: "#E895C0",
  },
  {
    name: "Cinza",
    bg: "#ECECEC",
    border: "#6B7280",
    fg: "#333333",
    darkBg: "#1F2937",
    darkFg: "#9CA3AF",
  },
];

const TRACK_NAMES: Record<string, Record<"pt" | "en", string>> = {
  work:     { pt: "Trabalho",         en: "Work" },
  studies:  { pt: "Estudos",          en: "Studies" },
  projects: { pt: "Projetos Pessoais", en: "Personal Projects" },
};

const TRILHA_NAMES: Record<string, Record<"pt" | "en", string>> = {
  pendente:     { pt: "Pendente",     en: "Pending" },
  "em-andamento": { pt: "Em andamento", en: "In Progress" },
  concluido:    { pt: "Concluído",    en: "Completed" },
  pausado:      { pt: "Pausado",      en: "On Hold" },
};

export function getDefaultTracks(locale: "pt" | "en" = "pt"): Omit<Track, "id">[] {
  return [
    { name: TRACK_NAMES.work[locale],     bg: "#EEEDFE", border: "#7F77DD", fg: "#3C3489", darkBg: "#26215C", darkFg: "#AFA9EC", order: 0 },
    { name: TRACK_NAMES.studies[locale],  bg: "#E1F5EE", border: "#1D9E75", fg: "#085041", darkBg: "#04342C", darkFg: "#5DCAA5", order: 1 },
    { name: TRACK_NAMES.projects[locale], bg: "#FAEEDA", border: "#EF9F27", fg: "#633806", darkBg: "#412402", darkFg: "#FAC775", order: 2 },
  ];
}

export function getDefaultTrilhas(locale: "pt" | "en" = "pt"): Trilha[] {
  return [
    { id: "pendente",      name: TRILHA_NAMES["pendente"][locale],      bg: "#ECECEC", fg: "#333333" },
    { id: "em-andamento",  name: TRILHA_NAMES["em-andamento"][locale],  bg: "#E6F1FB", fg: "#0C447C" },
    { id: "concluido",     name: TRILHA_NAMES["concluido"][locale],     bg: "#EAF3DE", fg: "#27500A" },
    { id: "pausado",       name: TRILHA_NAMES["pausado"][locale],       bg: "#FAEEDA", fg: "#633806" },
  ];
}

export const DEFAULT_TRACKS = getDefaultTracks("pt");
export const DEFAULT_TRILHAS = getDefaultTrilhas("pt");

export const TRILHA_COLOR_PRESETS: { bg: string; fg: string }[] = [
  { bg: "#EEEDFE", fg: "#3C3489" },
  { bg: "#E1F5EE", fg: "#085041" },
  { bg: "#FAEEDA", fg: "#633806" },
  { bg: "#E6F1FB", fg: "#0C447C" },
  { bg: "#FCEBEB", fg: "#791F1F" },
  { bg: "#EAF3DE", fg: "#27500A" },
  { bg: "#FDE6F3", fg: "#7A1D55" },
  { bg: "#ECECEC", fg: "#333333" },
];

type SeedCard = Omit<Card, "id" | "created_at" | "updated_at" | "track">;

const SEED_CARDS_PT: Record<string, SeedCard[]> = {
  Trabalho: [
    { col: "inprogress", type: "Task", title: "Organizar pendências da semana", desc: "Liste as tarefas mais importantes e defina prioridades.", prio: "Alta", starred: true, tags: ["em-andamento"], order: 1, checklist: [], blocked_by: [] },
    { col: "todo", type: "Task", title: "Responder e-mails importantes", prio: "Média", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
    { col: "backlog", type: "Task", title: "Planejar próximo mês", desc: "Revisar metas e definir foco.", prio: "Baixa", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
  ],
  Estudos: [
    { col: "inprogress", type: "Task", title: "Leitura do capítulo atual", desc: "Avance no material que está estudando no momento.", prio: "Alta", starred: false, tags: ["em-andamento"], order: 1, checklist: [], blocked_by: [] },
    { col: "todo", type: "Task", title: "Revisar anotações da semana", prio: "Média", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
    { col: "backlog", type: "Goal", title: "Concluir curso ou certificação", desc: "Defina o objetivo de aprendizado e acompanhe o progresso.", prio: "Média", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
  ],
  "Projetos Pessoais": [
    { col: "inprogress", type: "Goal", title: "Definir escopo do projeto", desc: "Descreva o que quer construir e qual problema resolve.", prio: "Alta", starred: true, tags: ["em-andamento"], order: 1, checklist: [], blocked_by: [] },
    { col: "todo", type: "Task", title: "Pesquisar referências e inspirações", prio: "Média", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
    { col: "backlog", type: "Task", title: "Ideia para explorar futuramente", desc: "Guarde aqui ideias que ainda não têm prazo definido.", prio: "Baixa", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
  ],
};

const SEED_CARDS_EN: Record<string, SeedCard[]> = {
  Work: [
    { col: "inprogress", type: "Task", title: "Organize this week's tasks", desc: "List the most important tasks and set priorities.", prio: "Alta", starred: true, tags: ["em-andamento"], order: 1, checklist: [], blocked_by: [] },
    { col: "todo", type: "Task", title: "Reply to important emails", prio: "Média", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
    { col: "backlog", type: "Task", title: "Plan next month", desc: "Review goals and define focus.", prio: "Baixa", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
  ],
  Studies: [
    { col: "inprogress", type: "Task", title: "Read current chapter", desc: "Advance on the material you're studying right now.", prio: "Alta", starred: false, tags: ["em-andamento"], order: 1, checklist: [], blocked_by: [] },
    { col: "todo", type: "Task", title: "Review this week's notes", prio: "Média", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
    { col: "backlog", type: "Goal", title: "Complete a course or certification", desc: "Define your learning goal and track progress.", prio: "Média", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
  ],
  "Personal Projects": [
    { col: "inprogress", type: "Goal", title: "Define project scope", desc: "Describe what you want to build and what problem it solves.", prio: "Alta", starred: true, tags: ["em-andamento"], order: 1, checklist: [], blocked_by: [] },
    { col: "todo", type: "Task", title: "Research references and inspiration", prio: "Média", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
    { col: "backlog", type: "Task", title: "Idea to explore later", desc: "Store ideas here that don't have a deadline yet.", prio: "Baixa", starred: false, tags: ["pendente"], order: 1, checklist: [], blocked_by: [] },
  ],
};

export function getSeedCardsByTrack(locale: "pt" | "en" = "pt"): Record<string, SeedCard[]> {
  return locale === "en" ? SEED_CARDS_EN : SEED_CARDS_PT;
}

export type ActivityType =
  | "created"
  | "moved"
  | "edited"
  | "starred"
  | "unstarred"
  | "checklist"
  | "deleted_checklist"
  | "deadline"
  | "priority"
  | "blocked"
  | "unblocked"
  | "duplicated";

export interface Activity {
  id: string;
  task_id: string;
  type: ActivityType;
  message: string;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface TimeLog {
  id: string;
  task_id: string;
  minutes: number;
  note?: string;
  logged_at: string;
  created_at: string;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export interface CardTemplate {
  id: string;
  name: string;
  type: TaskType;
  prio: Priority;
  desc?: string;
  date?: string;
  tags: string[];
  checklist: ChecklistItem[];
  created_at: string;
}

const TEMPLATES_KEY = "kanban-templates-v1";
const CARD_COLORS_KEY = "kanban-card-colors-v1";

export const CARD_COLOR_PRESETS = [
  { name: "none", bg: "transparent", label: "Nenhuma" },
  { name: "red", bg: "#ef4444", label: "Vermelho" },
  { name: "orange", bg: "#f97316", label: "Laranja" },
  { name: "yellow", bg: "#eab308", label: "Amarelo" },
  { name: "green", bg: "#22c55e", label: "Verde" },
  { name: "blue", bg: "#3b82f6", label: "Azul" },
  { name: "purple", bg: "#a855f7", label: "Roxo" },
  { name: "pink", bg: "#ec4899", label: "Rosa" },
];

export function loadCardColors(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CARD_COLORS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveCardColors(colors: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARD_COLORS_KEY, JSON.stringify(colors));
}

export function loadTemplates(): CardTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTemplates(templates: CardTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

const COLLAPSED_KEY = "kanban-collapsed-tracks-v1";

export function loadCollapsed(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveCollapsed(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify(state));
}

export function formatDate(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Dias após mover para "Done" que o card é considerado arquivado
// (some do Board, continua visível no Dashboards)
export const ARCHIVE_AFTER_DAYS = 7;

export function isArchived(card: Card): boolean {
  if (card.col !== "done") return false;
  const updated = new Date(card.updated_at).getTime();
  const cutoff = Date.now() - ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  return updated < cutoff;
}

export type DeadlineStatus = "overdue" | "today" | "soon" | null;

// Retorna o status do prazo de um card (ignora cards done/arquivados)
export function getDeadlineStatus(card: Card): DeadlineStatus {
  if (!card.date || card.col === "done") return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(card.date + "T00:00:00");
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "soon";
  return null;
}

// Calcula o progresso de um Goal baseado em suas Tasks filhas
export function getGoalProgress(
  goal: Card,
  allCards: Card[],
): { done: number; total: number; percent: number } {
  const children = allCards.filter((c) => c.parent_id === goal.id);
  if (children.length === 0) return { done: 0, total: 0, percent: 0 };
  const done = children.filter((c) => c.col === "done").length;
  const percent = Math.round((done / children.length) * 100);
  return { done, total: children.length, percent };
}

// Calcula o progresso do checklist de um card
export function getChecklistProgress(card: Card): { done: number; total: number; percent: number } {
  const items = card.checklist ?? [];
  if (items.length === 0) return { done: 0, total: 0, percent: 0 };
  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return { done, total: items.length, percent };
}

// Verifica se um card está bloqueado por dependências não-resolvidas
export function isBlocked(card: Card, allCards: Card[]): boolean {
  const blockers = card.blocked_by ?? [];
  if (blockers.length === 0) return false;
  return blockers.some((blockerId) => {
    const blocker = allCards.find((c) => c.id === blockerId);
    return blocker && blocker.col !== "done";
  });
}

export function getCardAging(card: Card): number {
  const updated = new Date(card.updated_at).getTime();
  const now = Date.now();
  const daysSinceUpdate = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate < 7) return 1;
  if (daysSinceUpdate < 14) return 0.7;
  if (daysSinceUpdate < 30) return 0.5;
  return 0.3;
}
