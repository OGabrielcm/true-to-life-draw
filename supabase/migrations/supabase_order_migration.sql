-- ============================================================
-- Migration: Reordenação de cards dentro da coluna
-- ============================================================
-- Adiciona coluna `order` (double precision) em tasks para
-- permitir reordenação manual com inserções entre cards
-- (ex: entre 1.0 e 2.0 → 1.5, sem renumerar os demais).
-- ============================================================

alter table public.tasks
  add column if not exists "order" double precision not null default 0;

-- Inicializa `order` dos cards existentes por created_at
-- (mais antigos = menor order). Cada combinação (track, col)
-- recebe sua própria sequência 0, 1, 2, 3...
with ordered as (
  select
    id,
    row_number() over (
      partition by user_id, track, col
      order by created_at
    ) as rn
  from public.tasks
)
update public.tasks t
set "order" = ordered.rn
from ordered
where t.id = ordered.id
  and t."order" = 0;

-- Índice para acelerar a ordenação no board
create index if not exists tasks_order_idx
  on public.tasks(user_id, track, col, "order");
