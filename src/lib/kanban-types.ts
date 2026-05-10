export type ColumnId = "backlog" | "todo" | "inprogress" | "review" | "done";
export type Priority = "Alta" | "Média" | "Baixa";
export type TrackId = "estagio" | "faculdade" | "ia-dev";
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
}

export const TRACKS: Track[] = [
  { id: "estagio", name: "Estágio", bg: "#EEEDFE", border: "#7F77DD", fg: "#3C3489", darkBg: "#26215C", darkFg: "#AFA9EC" },
  { id: "faculdade", name: "Faculdade", bg: "#E1F5EE", border: "#1D9E75", fg: "#085041", darkBg: "#04342C", darkFg: "#5DCAA5" },
  { id: "ia-dev", name: "IA / Dev", bg: "#FAEEDA", border: "#EF9F27", fg: "#633806", darkBg: "#412402", darkFg: "#FAC775" },
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

export const SEED_CARDS: Omit<Card, "id" | "created_at" | "updated_at">[] = [
  { track: "estagio", col: "inprogress", type: "Task", title: "Integração com API REST do módulo de relatórios", desc: "Conectar endpoint ao painel de visualização.", prio: "Alta", date: "2026-05-15", starred: false, tags: ["estagio", "dev"] },
  { track: "estagio", col: "todo", type: "Task", title: "Revisar documentação técnica do cliente", prio: "Média", date: "2026-05-22", starred: false, tags: ["estagio"] },
  { track: "estagio", col: "backlog", type: "Task", title: "Proposta de melhoria no pipeline de CI/CD", prio: "Baixa", starred: false, tags: ["estagio", "dev"] },
  { track: "faculdade", col: "review", type: "Task", title: "Flutter — Mobile Dev (Prof. Joseph)", desc: "Entregar o app da disciplina.", prio: "Alta", date: "2026-05-18", starred: true, tags: ["faculdade"] },
  { track: "faculdade", col: "todo", type: "Task", title: "Relatório BD — EscolaPrometheus", desc: "SQL Server com triggers, procedures e modelo relacional.", prio: "Alta", date: "2026-05-20", starred: false, tags: ["faculdade"] },
  { track: "faculdade", col: "todo", type: "Task", title: "Prova — Redes de Computadores", desc: "Revisar camadas OSI, TCP/IP e subnetting.", prio: "Média", date: "2026-05-28", starred: false, tags: ["faculdade"] },
  { track: "ia-dev", col: "inprogress", type: "Goal", title: "FinScan — fase 2", desc: "Suporte a múltiplas contas e gráficos.", prio: "Alta", date: "2026-06-15", starred: true, tags: ["ia", "dev"] },
  { track: "ia-dev", col: "inprogress", type: "Task", title: "FinScan — parser de PDF Nubank", desc: "Corrigir bug de extração de transações.", prio: "Alta", date: "2026-05-16", starred: false, tags: ["ia", "dev"] },
  { track: "ia-dev", col: "todo", type: "Task", title: "CRUD biblioteca — C# console", desc: "Finalizar Sistema de Biblioteca Leia Mais.", prio: "Média", date: "2026-05-25", starred: false, tags: ["dev"] },
  { track: "ia-dev", col: "backlog", type: "Task", title: "Agente de análise de PDFs com Claude API", prio: "Média", date: "2026-06-01", starred: false, tags: ["ia", "dev"] },
];

const CARDS_KEY = "kanban-cards-v2";
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
      const now = new Date().toISOString();
      const seeded: Card[] = SEED_CARDS.map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      }));
      localStorage.setItem(CARDS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<Card>[];
    const now = new Date().toISOString();
    return parsed.map((c) => ({
      id: c.id!,
      col: c.col!,
      track: (c.track as TrackId) ?? inferTrack(c.tags ?? []),
      type: (c.type as TaskType) ?? "Task",
      parent_id: c.parent_id,
      title: c.title!,
      desc: c.desc,
      prio: c.prio!,
      date: c.date,
      starred: c.starred ?? false,
      tags: c.tags ?? [],
      created_at: c.created_at ?? now,
      updated_at: c.updated_at ?? now,
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
