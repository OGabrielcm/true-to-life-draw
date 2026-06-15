import type { VercelRequest, VercelResponse } from "@vercel/node";

// O conector do Claude faz descoberta de OAuth batendo em
// /.well-known/oauth-* ANTES de conectar no MCP. Se esses paths caírem no
// catch-all do SPA (HTML 200), o Claude acha que existe um servidor OAuth e
// tenta registrar um client — o que falha. Retornando 404 aqui, o Claude
// conclui "sem OAuth" e conecta direto no endpoint MCP (soft auth via ?key=).
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(404).json({ error: "Not found" });
}
