export type ColumnId = "backlog" | "todo" | "inprogress" | "review" | "done";
export type Priority = "Alta" | "Média" | "Baixa";
export type TrackId = "estagio" | "faculdade" | "ia-dev";

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
  title: string;
  desc?: string;
  prio: Priority;
  date?: string;
  tags: string[]; // trilha ids
}

export const COLUMNS: { id: ColumnId; name: string }[] = [
  { id: "backlog", name: "Backlog" },
  { id: "todo", name: "To Do" },
  { id: "inprogress", name: "In Progress" },
  { id: "review", name: "Review" },
  { id: "done", name: "Done" },
];

export const PRIORITIES: Priority[] = ["Alta", "Média", "Baixa"];

export const PRIO_COLORS: Record<Priority, { bg: string; fg: string }> = {
  "Alta": { bg: "#FCEBEB", fg: "#791F1F" },
  "Média": { bg: "#FAEEDA", fg: "#633806" },
  "Baixa": { bg: "#EAF3DE", fg: "#27500A" },
};

export interface Track {
  id: TrackId;
  name: string;
  bg: string;
  border: string;
  fg: string;
}

export const TRACKS: Track[] = [
  { id: "estagio", name: "Estágio", bg: "#EEEDFE", border: "#7F77DD", fg: "#3C3489" },
  { id: "faculdade", name: "Faculdade", bg: "#E1F5EE", border: "#1D9E75", fg: "#085041" },
  { id: "ia-dev", name: "IA / Dev", bg: "#FAEEDA", border: "#EF9F27", fg: "#633806" },
];

// Stable default trilha ids so seed cards reference them
export const DEFAULT_TRILHAS: Trilha[] = [
  { id: "estagio", name: "Estágio", bg: "#EEEDFE", fg: "#3C3489" },
  { id: "faculdade", name: "Faculdade", bg: "#E1F5EE", fg: "#085041" },
  { id: "ia", name: "IA", bg: "#FAEEDA", fg: "#633806" },
  { id: "dev", name: "Dev", bg: "#E6F1FB", fg: "#0C447C" },
];

export const TRILHA_COLOR_PRESETS: { bg: string; fg: string }[] = [
  { bg: "#EEEDFE", fg: "#3C3489" }, // roxo
  { bg: "#E1F5EE", fg: "#085041" }, // teal
  { bg: "#FAEEDA", fg: "#633806" }, // âmbar
  { bg: "#E6F1FB", fg: "#0C447C" }, // azul
  { bg: "#FCEBEB", fg: "#791F1F" }, // vermelho
  { bg: "#EAF3DE", fg: "#27500A" }, // verde
  { bg: "#FDE6F3", fg: "#7A1D55" }, // rosa
  { bg: "#ECECEC", fg: "#333333" }, // cinza
];

export const SEED_CARDS: Omit<Card, "id">[] = [
  { track: "estagio", col: "inprogress", title: "Integração com API de estágio", desc: "Conectar endpoint REST ao módulo de relatórios.", prio: "Alta", date: "2026-05-15", tags: ["estagio", "dev"] },
  { track: "faculdade", col: "todo", title: "Relatório de BD — EscolaPrometheus", desc: "Entrega do projeto SQL Server com triggers e procedures.", prio: "Alta", date: "2026-05-20", tags: ["faculdade"] },
  { track: "ia-dev", col: "backlog", title: "Agente de análise de PDFs com IA", desc: "Usar Claude API para extrair dados de extratos bancários.", prio: "Média", date: "2026-06-01", tags: ["ia", "dev"] },
  { track: "ia-dev", col: "todo", title: "CRUD biblioteca — C# console", desc: "Finalizar Sistema de Biblioteca Leia Mais.", prio: "Média", date: "2026-05-25", tags: ["dev"] },
  { track: "faculdade", col: "review", title: "Flutter — Mobile Dev (UNINASSAU)", desc: "Entregar o app da disciplina do Prof. Joseph.", prio: "Alta", date: "2026-05-18", tags: ["faculdade"] },
  { track: "ia-dev", col: "backlog", title: "Roadmap FinScan — fase 2", desc: "Planejar suporte a múltiplas contas e gráficos.", prio: "Baixa", date: "2026-06-15", tags: ["ia", "dev"] },
  { track: "estagio", col: "done", title: "Setup Docker SQL Server (MacBook)", desc: "Configurado e testado com mssql extension.", prio: "Baixa", date: "2026-05-01", tags: ["dev"] },
];

const CARDS_KEY = "kanban-cards-v1";
const TRILHAS_KEY = "kanban-trilhas-v1";
const COLLAPSED_KEY = "kanban-collapsed-tracks-v1";

function inferTrack(tags: string[]): TrackId {
  if (tags.includes("faculdade")) return "faculdade";
  if (tags.includes("estagio")) return "estagio";
  return "ia-dev";
}

export function loadCards(): Card[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (!raw) {
      const seeded = SEED_CARDS.map((c) => ({ ...c, id: crypto.randomUUID() }));
      localStorage.setItem(CARDS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Card[];
    // Migrate older cards without `track`
    return parsed.map((c) => ({
      ...c,
      track: (c.track as TrackId) ?? inferTrack(c.tags ?? []),
    }));
  } catch {
    return [];
  }
}

export function saveCards(cards: Card[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function loadTrilhas(): Trilha[] {
  if (typeof window === "undefined") return DEFAULT_TRILHAS;
  try {
    const raw = localStorage.getItem(TRILHAS_KEY);
    if (!raw) {
      localStorage.setItem(TRILHAS_KEY, JSON.stringify(DEFAULT_TRILHAS));
      return DEFAULT_TRILHAS;
    }
    return JSON.parse(raw) as Trilha[];
  } catch {
    return DEFAULT_TRILHAS;
  }
}

export function saveTrilhas(trilhas: Trilha[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRILHAS_KEY, JSON.stringify(trilhas));
}

export function loadCollapsed(): Record<TrackId, boolean> {
  const empty = { estagio: false, faculdade: false, "ia-dev": false } as Record<TrackId, boolean>;
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

export function saveCollapsed(state: Record<TrackId, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify(state));
}

export function formatDate(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
