export type ColumnId = "backlog" | "todo" | "inprogress" | "review" | "done";
export type Priority = "Alta" | "Média" | "Baixa";
export type TrackId = string;
export type TaskType = "Task" | "Goal";

export interface Trilha {
  id: string;
  name: string;
  bg: string;
  fg: string;
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
  created_at: string;
  updated_at: string;
}

export const COLUMNS: { id: ColumnId; name: string }[] = [
  { id: "backlog", name: "Backlog" },
  { id: "todo", name: "To Do" },
  { id: "inprogress", name: "In Progress" },
  { id: "review", name: "Review" },
  { id: "done", name: "Done" },
];

export const PRIORITIES: Priority[] = ["Alta", "Média", "Baixa"];

export const PRIO_COLORS: Record<Priority, { bg: string; fg: string; darkBg: string; darkFg: string }> = {
  "Alta": { bg: "#FCEBEB", fg: "#791F1F", darkBg: "#501313", darkFg: "#F09595" },
  "Média": { bg: "#FAEEDA", fg: "#633806", darkBg: "#412402", darkFg: "#FAC775" },
  "Baixa": { bg: "#EAF3DE", fg: "#27500A", darkBg: "#173404", darkFg: "#97C459" },
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
  { name: "Roxo",    bg: "#EEEDFE", border: "#7F77DD", fg: "#3C3489", darkBg: "#26215C", darkFg: "#AFA9EC" },
  { name: "Verde",   bg: "#E1F5EE", border: "#1D9E75", fg: "#085041", darkBg: "#04342C", darkFg: "#5DCAA5" },
  { name: "Laranja", bg: "#FAEEDA", border: "#EF9F27", fg: "#633806", darkBg: "#412402", darkFg: "#FAC775" },
  { name: "Azul",    bg: "#E6F1FB", border: "#3B82F6", fg: "#0C447C", darkBg: "#0A2540", darkFg: "#7AB6F0" },
  { name: "Vermelho", bg: "#FCEBEB", border: "#DC2626", fg: "#791F1F", darkBg: "#501313", darkFg: "#F09595" },
  { name: "Verde-claro", bg: "#EAF3DE", border: "#65A30D", fg: "#27500A", darkBg: "#173404", darkFg: "#97C459" },
  { name: "Rosa",    bg: "#FDE6F3", border: "#DB2777", fg: "#7A1D55", darkBg: "#4A0E33", darkFg: "#E895C0" },
  { name: "Cinza",   bg: "#ECECEC", border: "#6B7280", fg: "#333333", darkBg: "#1F2937", darkFg: "#9CA3AF" },
];

export const DEFAULT_TRACKS: Omit<Track, "id">[] = [
  { name: "Estágio",   bg: "#EEEDFE", border: "#7F77DD", fg: "#3C3489", darkBg: "#26215C", darkFg: "#AFA9EC", order: 0 },
  { name: "Faculdade", bg: "#E1F5EE", border: "#1D9E75", fg: "#085041", darkBg: "#04342C", darkFg: "#5DCAA5", order: 1 },
  { name: "IA / Dev",  bg: "#FAEEDA", border: "#EF9F27", fg: "#633806", darkBg: "#412402", darkFg: "#FAC775", order: 2 },
];

export const DEFAULT_TRILHAS: Trilha[] = [
  { id: "estagio", name: "Estágio", bg: "#EEEDFE", fg: "#3C3489" },
  { id: "faculdade", name: "Faculdade", bg: "#E1F5EE", fg: "#085041" },
  { id: "ia", name: "IA", bg: "#FAEEDA", fg: "#633806" },
  { id: "dev", name: "Dev", bg: "#E6F1FB", fg: "#0C447C" },
];

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

// Seed cards: usam slug das tracks padrão (mapeados após inserção)
export const SEED_CARDS_BY_TRACK: Record<string, Omit<Card, "id" | "created_at" | "updated_at" | "track">[]> = {
  "Estágio": [
    { col: "inprogress", type: "Task", title: "Integração com API REST do módulo de relatórios", desc: "Conectar endpoint ao painel de visualização.", prio: "Alta", date: "2026-05-15", starred: false, tags: ["estagio", "dev"] },
    { col: "todo", type: "Task", title: "Revisar documentação técnica do cliente", prio: "Média", date: "2026-05-22", starred: false, tags: ["estagio"] },
    { col: "backlog", type: "Task", title: "Proposta de melhoria no pipeline de CI/CD", prio: "Baixa", starred: false, tags: ["estagio", "dev"] },
  ],
  "Faculdade": [
    { col: "review", type: "Task", title: "Flutter — Mobile Dev (Prof. Joseph)", desc: "Entregar o app da disciplina.", prio: "Alta", date: "2026-05-18", starred: true, tags: ["faculdade"] },
    { col: "todo", type: "Task", title: "Relatório BD — EscolaPrometheus", desc: "SQL Server com triggers, procedures e modelo relacional.", prio: "Alta", date: "2026-05-20", starred: false, tags: ["faculdade"] },
    { col: "todo", type: "Task", title: "Prova — Redes de Computadores", desc: "Revisar camadas OSI, TCP/IP e subnetting.", prio: "Média", date: "2026-05-28", starred: false, tags: ["faculdade"] },
  ],
  "IA / Dev": [
    { col: "inprogress", type: "Goal", title: "FinScan — fase 2", desc: "Suporte a múltiplas contas e gráficos.", prio: "Alta", date: "2026-06-15", starred: true, tags: ["ia", "dev"] },
    { col: "inprogress", type: "Task", title: "FinScan — parser de PDF Nubank", desc: "Corrigir bug de extração de transações.", prio: "Alta", date: "2026-05-16", starred: false, tags: ["ia", "dev"] },
    { col: "todo", type: "Task", title: "CRUD biblioteca — C# console", desc: "Finalizar Sistema de Biblioteca Leia Mais.", prio: "Média", date: "2026-05-25", starred: false, tags: ["dev"] },
    { col: "backlog", type: "Task", title: "Agente de análise de PDFs com Claude API", prio: "Média", date: "2026-06-01", starred: false, tags: ["ia", "dev"] },
  ],
};

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
