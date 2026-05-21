-- ============================================================
-- Migration: Suporte a Anexos em cards
-- Cole este SQL no SQL Editor do Supabase e execute.
-- Depois crie o bucket manualmente conforme as instruções abaixo.
-- ============================================================

-- 1. Coluna attachments na tabela tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb NOT NULL;

COMMENT ON COLUMN public.tasks.attachments IS
  'Array de anexos do card: [{ id, name, path, mime, size, uploaded_at }]';

-- ============================================================
-- Criar o bucket no Supabase Storage (não dá via SQL):
--
-- 1. Acesse: Dashboard → Storage → New Bucket
-- 2. Nome: attachments
-- 3. Public: SIM (para permitir download direto por URL)
-- 4. File size limit: 20 MB (20971520 bytes)
-- 5. Allowed MIME types (opcional): image/*, application/pdf,
--    application/msword, application/vnd.openxmlformats-officedocument.*
--
-- Políticas de Storage (Dashboard → Storage → Policies → attachments):
--
-- INSERT (upload):
--   Quem: authenticated
--   Policy: (storage.foldername(name))[1] = auth.uid()::text
--   (garante que o usuário só sobe em sua própria pasta)
--
-- SELECT (download/leitura pública — bucket já é public):
--   Não é necessária política adicional em bucket público.
--
-- DELETE (remoção):
--   Quem: authenticated
--   Policy: (storage.foldername(name))[1] = auth.uid()::text
-- ============================================================
