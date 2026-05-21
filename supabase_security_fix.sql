-- Security fixes based on Supabase advisor warnings
-- Apply via: Supabase Dashboard → SQL Editor → Run

-- Fix 1: update_updated_at_column — search_path mutable
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix 2: remove_tag_from_tasks
-- Troca SECURITY DEFINER → SECURITY INVOKER para que o RLS seja aplicado.
-- Sem isso, qualquer anon pode chamar /rpc/remove_tag_from_tasks e apagar
-- tags de todos os cards do banco, não só os seus.
CREATE OR REPLACE FUNCTION public.remove_tag_from_tasks(tag_id text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
begin
  update public.tasks set tags = array_remove(tags, tag_id);
end;
$$;

-- Fix 3: rls_auto_enable — event trigger, não deve ser chamável via API
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
