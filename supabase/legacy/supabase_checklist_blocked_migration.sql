-- Add checklist and blocked_by fields to tasks
-- checklist: JSONB array of { id, text, done }
-- blocked_by: array of task ids that block this task

ALTER TABLE public.tasks
ADD COLUMN checklist jsonb DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE public.tasks
ADD COLUMN blocked_by text[] DEFAULT '{}'::text[] NOT NULL;

COMMENT ON COLUMN public.tasks.checklist IS 'Array of checklist items: [{ id, text, done }]';
COMMENT ON COLUMN public.tasks.blocked_by IS 'Array of task IDs that block this task (dependencies)';
