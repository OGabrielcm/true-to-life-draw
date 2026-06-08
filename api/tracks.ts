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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (!auth(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const [{ data: tracks, error: tracksError }, { data: columns, error: colsError }] =
    await Promise.all([
      supabase
        .from("tracks")
        .select("id, name, order")
        .eq("user_id", TTL_USER_ID)
        .order("order"),
      supabase
        .from("columns")
        .select("id, name, order, track_id")
        .eq("user_id", TTL_USER_ID)
        .order("order"),
    ]);

  if (tracksError) return res.status(500).json({ error: tracksError.message });
  if (colsError) return res.status(500).json({ error: colsError.message });

  return res.status(200).json({ tracks, columns });
}
