-- Bloco 3.3 — Preferência de tema por usuário (cross-device).
-- Adiciona a coluna `theme` na tabela user_profile. Default 'dark' (tema padrão
-- do app). Idempotente: seguro re-executar.
--
-- Valores válidos: 'dark' | 'light' | 'babyblue' | 'sepia'. A validação fica na
-- aplicação (theme-provider); um CHECK opcional pode ser adicionado se desejado.

ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark';

-- As políticas de RLS de UPDATE/SELECT da user_profile já permitem ao usuário
-- ler e escrever a própria row (o app já atualiza onboarding_completed pelo
-- mesmo caminho). A coluna theme é coberta pelas mesmas políticas — não requer
-- policy nova. Verificar via Supabase MCP / dashboard se houver dúvida.
