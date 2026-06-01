-- Bloco 4 — Anexos no Card
-- Cria a infraestrutura de anexos: tabela de metadados (public.attachments),
-- o bucket de Storage (`attachments`) e as políticas RLS das DUAS camadas
-- (tabela em public + objetos em storage). Idempotente.
--
-- Decisões:
--  • Metadados em tabela dedicada (consistente com comments/time_logs/activities).
--  • Bucket público (SELECT liberado) para exibir arquivos direto nos cards.
--  • Delete restrito ao dono via storage.objects.owner_id (uid de quem subiu).
--  • Sem allowlist de mime no banco; o bucket limita só o tamanho (20MB).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tabela de metadados
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- caminho do objeto no bucket: `${task_id}/${uuid}-${nome}`
  path text not null,
  name text not null,
  mime text,
  size_bytes integer,
  created_at timestamptz not null default now()
);

comment on table public.attachments is 'Anexos (arquivos) por card. O binário vive no bucket Storage `attachments`; esta tabela guarda apenas os metadados.';

create index if not exists attachments_task_id_idx on public.attachments (task_id);

alter table public.attachments enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RLS da TABELA (public.attachments)
--    SELECT liberado a qualquer autenticado (anexos são exibidos nos cards);
--    INSERT/DELETE apenas pelo dono.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists attachments_select_auth on public.attachments;
create policy attachments_select_auth on public.attachments
  for select to authenticated using (true);

drop policy if exists attachments_insert_own on public.attachments;
create policy attachments_insert_own on public.attachments
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists attachments_delete_own on public.attachments;
create policy attachments_delete_own on public.attachments
  for delete to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Bucket de Storage
--    Público (Public: SIM), limite 20MB, sem restrição de mime.
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', true, 20971520)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS dos OBJETOS (storage.objects) para o bucket `attachments`
--    INSERT: qualquer autenticado pode subir.
--    SELECT: público (bucket público → exibir nos cards).
--    DELETE: apenas o dono do arquivo (owner_id = uid de quem subiu).
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists attachments_objects_insert on storage.objects;
create policy attachments_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments');

drop policy if exists attachments_objects_select on storage.objects;
create policy attachments_objects_select on storage.objects
  for select to public
  using (bucket_id = 'attachments');

drop policy if exists attachments_objects_delete on storage.objects;
create policy attachments_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and owner_id = auth.uid()::text);
