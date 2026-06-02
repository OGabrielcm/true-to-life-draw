-- Habit Tracker — Fase 1
-- Cria a infraestrutura de hábitos: tabela `habits` (definição) + `habit_logs`
-- (log de cumprimento por dia). Idempotente. Espelha o idiom de RLS per-user
-- de supabase_attachments_migration.sql.
--
-- Decisões:
--  • Sistema separado do board (não referencia `tasks`).
--  • Sem coluna `done` em habit_logs: a PRESENÇA da row = feito. Toggle
--    insere/deleta. `unique (habit_id, date)` garante 1 log por dia.
--  • Streak e heatmap derivam só de habit_logs — sem score cacheado.
--  • frequency jsonb: {type:"daily"} | {type:"weekdays", days:int[]} (0=domingo).
--    Comporta {type:"timesPerWeek", count} no futuro sem migration.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. habits — definição do hábito
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text,
  frequency jsonb not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.habits is 'Hábitos do usuário (habit tracker). Sistema separado do board.';

create index if not exists habits_user_id_idx on public.habits (user_id);

alter table public.habits enable row level security;

drop policy if exists habits_select_own on public.habits;
create policy habits_select_own on public.habits
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists habits_insert_own on public.habits;
create policy habits_insert_own on public.habits
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists habits_update_own on public.habits;
create policy habits_update_own on public.habits
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists habits_delete_own on public.habits;
create policy habits_delete_own on public.habits
  for delete to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. habit_logs — cumprimento por dia (presença = feito)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

comment on table public.habit_logs is 'Log de cumprimento de hábito por dia. A presença da row indica que o hábito foi feito naquele dia.';

create index if not exists habit_logs_habit_id_idx on public.habit_logs (habit_id);

alter table public.habit_logs enable row level security;

drop policy if exists habit_logs_select_own on public.habit_logs;
create policy habit_logs_select_own on public.habit_logs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists habit_logs_insert_own on public.habit_logs;
create policy habit_logs_insert_own on public.habit_logs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists habit_logs_delete_own on public.habit_logs;
create policy habit_logs_delete_own on public.habit_logs
  for delete to authenticated using (auth.uid() = user_id);
