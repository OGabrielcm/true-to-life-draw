export type ColumnId = "backlog" | "todo" | "inprogress" | "review" | "done";
export type Priority = "Alta" | "Média" | "Baixa";
export type Tag = "Estágio" | "Faculdade" | "IA" | "Dev";

export interface Card {
  id: string;
  col: ColumnId;
  title: string;
  desc?: string;
  prio: Priority;
  date?: string; // ISO YYYY-MM-DD
  tags: Tag[];
}

export const COLUMNS: { id: ColumnId; name: string }[] = [
  { id: "backlog", name: "Backlog" },
  { id: "todo", name: "To Do" },
  { id: "inprogress", name: "In Progress" },
  { id: "review", name: "Review" },
  { id: "done", name: "Done" },
];

export const TAGS: Tag[] = ["Estágio", "Faculdade", "IA", "Dev"];
export const PRIORITIES: Priority[] = ["Alta", "Média", "Baixa"];

export const TAG_COLORS: Record<Tag, { bg: string; fg: string }> = {
  "Estágio": { bg: "#EEEDFE", fg: "#3C3489" },
  "Faculdade": { bg: "#E1F5EE", fg: "#085041" },
  "IA": { bg: "#FAEEDA", fg: "#633806" },
  "Dev": { bg: "#E6F1FB", fg: "#0C447C" },
};

export const PRIO_COLORS: Record<Priority, { bg: string; fg: string }> = {
  "Alta": { bg: "#FCEBEB", fg: "#791F1F" },
  "Média": { bg: "#FAEEDA", fg: "#633806" },
  "Baixa": { bg: "#EAF3DE", fg: "#27500A" },
};

export const SEED: Omit<Card, "id">[] = [
  { col: "inprogress", title: "Integração com API de estágio", desc: "Conectar endpoint REST ao módulo de relatórios.", prio: "Alta", date: "2026-05-15", tags: ["Estágio", "Dev"] },
  { col: "todo", title: "Relatório de BD — EscolaPrometheus", desc: "Entrega do projeto SQL Server com triggers e procedures.", prio: "Alta", date: "2026-05-20", tags: ["Faculdade"] },
  { col: "backlog", title: "Agente de análise de PDFs com IA", desc: "Usar Claude API para extrair dados de extratos bancários.", prio: "Média", date: "2026-06-01", tags: ["IA", "Dev"] },
  { col: "todo", title: "CRUD biblioteca — C# console", desc: "Finalizar Sistema de Biblioteca Leia Mais.", prio: "Média", date: "2026-05-25", tags: ["Dev"] },
  { col: "review", title: "Flutter — Mobile Dev (UNINASSAU)", desc: "Entregar o app da disciplina do Prof. Joseph.", prio: "Alta", date: "2026-05-18", tags: ["Faculdade"] },
  { col: "backlog", title: "Roadmap FinScan — fase 2", desc: "Planejar suporte a múltiplas contas e gráficos.", prio: "Baixa", date: "2026-06-15", tags: ["IA", "Dev"] },
  { col: "done", title: "Setup Docker SQL Server (MacBook)", desc: "Configurado e testado com mssql extension.", prio: "Baixa", date: "2026-05-01", tags: ["Dev"] },
];

const KEY = "kanban-cards-v1";

export function loadCards(): Card[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seeded = SEED.map((c) => ({ ...c, id: crypto.randomUUID() }));
      localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Card[];
  } catch {
    return [];
  }
}

export function saveCards(cards: Card[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(cards));
}

export function formatDate(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
