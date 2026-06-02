-- Add WIP limit support to columns table
ALTER TABLE public.columns
ADD COLUMN wip_limit integer DEFAULT NULL;

COMMENT ON COLUMN public.columns.wip_limit IS 'Work in Progress limit for this column. NULL means no limit.';
