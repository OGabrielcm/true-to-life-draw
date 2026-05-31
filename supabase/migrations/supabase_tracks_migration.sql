-- ============================================================
-- Migration: Tracks dinâmicas (swimlanes editáveis)
-- ============================================================
-- Rode este SQL no SQL Editor do Supabase para criar a tabela
-- `tracks` necessária para o feature de criação/edição de tracks.
-- ============================================================

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bg text not null,
  border text not null,
  fg text not null,
  dark_bg text not null,
  dark_fg text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

-- Índice para queries por usuário
create index if not exists tracks_user_id_idx on public.tracks(user_id);
create index if not exists tracks_order_idx on public.tracks(user_id, "order");

-- RLS: cada usuário só vê e modifica suas próprias tracks
alter table public.tracks enable row level security;

drop policy if exists "tracks_select_own" on public.tracks;
create policy "tracks_select_own"
  on public.tracks for select
  using (auth.uid() = user_id);

drop policy if exists "tracks_insert_own" on public.tracks;
create policy "tracks_insert_own"
  on public.tracks for insert
  with check (auth.uid() = user_id);

drop policy if exists "tracks_update_own" on public.tracks;
create policy "tracks_update_own"
  on public.tracks for update
  using (auth.uid() = user_id);

drop policy if exists "tracks_delete_own" on public.tracks;
create policy "tracks_delete_own"
  on public.tracks for delete
  using (auth.uid() = user_id);
