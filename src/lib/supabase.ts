import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Guard com mensagem acionável: o erro nativo do createClient ("supabaseUrl is
// required") não diz QUAL var faltou nem ONDE. Caso comum: `vercel env pull`
// grava VITE_SUPABASE_* vazias no .env.local, que tem prioridade sobre o .env
// no Vite e mascara as credenciais reais — derrubando o dev com tela branca.
if (!url || !key) {
  throw new Error(
    "Supabase não configurado: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes ou vazias. " +
      "Verifique o .env e, se existir, valores VAZIOS no .env.local que sobrescrevem o .env.",
  );
}

export const supabase = createClient(url, key);
