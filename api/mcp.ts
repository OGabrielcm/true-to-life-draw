import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TTL_API_KEY = process.env.TTL_API_KEY!;
const TTL_USER_ID = process.env.TTL_USER_ID!;

function createMcpServer() {
  const server = new McpServer({
    name: "molas-kanban",
    version: "1.0.0",
  });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  server.tool(
    "list_tasks",
    "Lista as tasks do board Molas Kanban com filtros opcionais",
    {
      col: z.string().optional().describe("ID da coluna (ex: backlog, todo, inprogress, review, done)"),
      track: z.string().optional().describe("ID da trilha (ex: IA / Dev, Pessoal)"),
      prio: z.enum(["Alta", "Média", "Baixa"]).optional().describe("Prioridade do card"),
      type: z.enum(["Task", "Goal"]).optional().describe("Tipo do card"),
      starred: z.boolean().optional().describe("Apenas cards favoritados"),
      limit: z.number().optional().default(50).describe("Máximo de tasks a retornar"),
    },
    async ({ col, track, prio, type, starred, limit }) => {
      let query = supabase
        .from("tasks")
        .select("id, title, col, track, type, prio, desc, date, starred, tags, checklist, order, created_at, updated_at")
        .eq("user_id", TTL_USER_ID)
        .order("order", { ascending: true })
        .limit(limit ?? 50);

      if (col) query = query.eq("col", col);
      if (track) query = query.eq("track", track);
      if (prio) query = query.eq("prio", prio);
      if (type) query = query.eq("type", type);
      if (starred !== undefined) query = query.eq("starred", starred);

      const { data, error } = await query;
      if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }] };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ tasks: data, count: data?.length ?? 0 }, null, 2),
        }],
      };
    },
  );

  server.tool(
    "create_task",
    "Cria uma nova task no board Molas Kanban",
    {
      title: z.string().describe("Título da task (obrigatório)"),
      col: z.string().optional().default("backlog").describe("ID da coluna destino"),
      track: z.string().optional().default("").describe("ID da trilha"),
      prio: z.enum(["Alta", "Média", "Baixa"]).optional().default("Média").describe("Prioridade"),
      desc: z.string().optional().describe("Descrição da task"),
      type: z.enum(["Task", "Goal"]).optional().default("Task").describe("Tipo"),
      date: z.string().optional().describe("Prazo no formato YYYY-MM-DD"),
      starred: z.boolean().optional().default(false).describe("Favoritar o card"),
      tags: z.array(z.string()).optional().default([]).describe("Etiquetas"),
    },
    async ({ title, col, track, prio, desc, type, date, starred, tags }) => {
      const { data: existing } = await supabase
        .from("tasks")
        .select("order")
        .eq("user_id", TTL_USER_ID)
        .eq("col", col ?? "backlog")
        .order("order", { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.order ?? 0) + 1;

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: TTL_USER_ID,
          title: title.trim(),
          col: col ?? "backlog",
          track: track ?? "",
          type: type ?? "Task",
          prio: prio ?? "Média",
          desc: desc ?? null,
          date: date ?? null,
          starred: starred ?? false,
          tags: tags ?? [],
          checklist: [],
          blocked_by: [],
          order: nextOrder,
        })
        .select()
        .single();

      if (error) return { content: [{ type: "text", text: `Erro ao criar task: ${error.message}` }] };
      return {
        content: [{
          type: "text",
          text: `Task criada com sucesso!\n${JSON.stringify(data, null, 2)}`,
        }],
      };
    },
  );

  server.tool(
    "list_tracks",
    "Lista as trilhas e colunas disponíveis no board Molas Kanban",
    {},
    async () => {
      const [{ data: tracks, error: tracksError }, { data: columns, error: colsError }] =
        await Promise.all([
          supabase.from("tracks").select("id, name, order").eq("user_id", TTL_USER_ID).order("order"),
          supabase.from("columns").select("id, name, order").eq("user_id", TTL_USER_ID).order("order"),
        ]);

      if (tracksError) return { content: [{ type: "text", text: `Erro: ${tracksError.message}` }] };
      if (colsError) return { content: [{ type: "text", text: `Erro: ${colsError.message}` }] };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ tracks, columns }, null, 2),
        }],
      };
    },
  );

  return server;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Mcp-Session-Id");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();

  // Auth via Bearer header OU query param ?key=xxx
  const header = req.headers["authorization"] ?? "";
  const headerKey = header.startsWith("Bearer ") ? header.slice(7) : "";
  const queryKey = (req.query?.key as string) ?? "";
  const key = headerKey || queryKey;
  if (TTL_API_KEY && key !== TTL_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST" && req.method !== "GET" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
