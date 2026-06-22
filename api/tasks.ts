import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TTL_API_KEY = process.env.TTL_API_KEY!;
const TTL_USER_ID = process.env.TTL_USER_ID!;

function auth(req: VercelRequest, res: VercelResponse): boolean {
  const header = req.headers["authorization"] ?? "";
  const key = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!TTL_API_KEY || key !== TTL_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (!auth(req, res)) return;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (req.method === "GET") {
    const { col, track, prio, type, starred, limit = "50" } = req.query as Record<string, string>;

    let query = supabase
      .from("tasks")
      .select(
        "id, title, col, track, type, prio, desc, date, starred, tags, checklist, blocked_by, order, created_at, updated_at",
      )
      .eq("user_id", TTL_USER_ID)
      .order("order", { ascending: true })
      .limit(Number(limit));

    if (col) query = query.eq("col", col);
    if (track) query = query.eq("track", track);
    if (prio) query = query.eq("prio", prio);
    if (type) query = query.eq("type", type);
    if (starred === "true") query = query.eq("starred", true);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ tasks: data, count: data?.length ?? 0 });
  }

  if (req.method === "POST") {
    const body = req.body as {
      title: string;
      col?: string;
      track?: string;
      prio?: "Alta" | "Média" | "Baixa";
      desc?: string;
      type?: "Task" | "Goal";
      date?: string;
      starred?: boolean;
      tags?: string[];
    };

    if (!body.title?.trim()) {
      return res.status(400).json({ error: "title is required" });
    }

    // Get the max order in target col to append at end
    const { data: existing } = await supabase
      .from("tasks")
      .select("order")
      .eq("user_id", TTL_USER_ID)
      .eq("col", body.col ?? "backlog")
      .order("order", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.order ?? 0) + 1;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: TTL_USER_ID,
        title: body.title.trim(),
        col: body.col ?? "backlog",
        track: body.track ?? "",
        type: body.type ?? "Task",
        prio: body.prio ?? "Média",
        desc: body.desc ?? null,
        date: body.date ?? null,
        starred: body.starred ?? false,
        tags: body.tags ?? [],
        checklist: [],
        blocked_by: [],
        order: nextOrder,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ task: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
