-- ============================================================
-- Migration: Colunas dinâmicas (colunas editáveis do board)
-- ============================================================
-- IMPORTANTE: A coluna `id` usa TEXT (não UUID) para backwards
-- compatibility com cards existentes que referenciam os IDs
-- antigos ("backlog", "todo", "inprogress", "review", "done").
-- ============================================================

create table if not exists public.columns (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists columns_user_id_idx on public.columns(user_id);
create index if not exists columns_order_idx on public.columns(user_id, "order");

alter table public.columns enable row level security;

drop policy if exists "columns_select_own" on public.columns;
create policy "columns_select_own"
  on public.columns for select
  using (auth.uid() = user_id);

drop policy if exists "columns_insert_own" on public.columns;
create policy "columns_insert_own"
  on public.columns for insert
  with check (auth.uid() = user_id);

drop policy if exists "columns_update_own" on public.columns;
create policy "columns_update_own"
  on public.columns for update
  using (auth.uid() = user_id);

drop policy if exists "columns_delete_own" on public.columns;
create policy "columns_delete_own"
  on public.columns for delete
  using (auth.uid() = user_id);
