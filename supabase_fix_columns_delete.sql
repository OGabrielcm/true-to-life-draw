-- Fix: adicionar política DELETE que ficou faltando na tabela columns
drop policy if exists "columns_delete_own" on public.columns;
create policy "columns_delete_own"
  on public.columns for delete
  using (auth.uid() = user_id);
