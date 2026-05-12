-- ============================================================
-- Verificação das tabelas e políticas do projeto Molas
-- Cole este SQL no SQL Editor do Supabase e me mostre o resultado
-- ============================================================

-- 1. Tabelas existentes
select
  table_name,
  'exists' as status
from information_schema.tables
where table_schema = 'public'
  and table_name in ('tasks', 'trilhas', 'tracks', 'columns')
order by table_name;

-- 2. Colunas de cada tabela
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('tasks', 'trilhas', 'tracks', 'columns')
order by table_name, ordinal_position;

-- 3. Políticas RLS ativas
select
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('tasks', 'trilhas', 'tracks', 'columns')
order by tablename, policyname;
