-- Fase 4 (4.5, 4.6, 4.7): Histórico de atividades, Comentários e Time tracking
-- 3 novas tabelas com RLS por user_id

-- 4.5 Activities (histórico imutável de eventos no card)
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_task_id ON public.activities(task_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select_own" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activities_insert_own" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_delete_own" ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.activities IS 'Histórico imutável de eventos por card (criado, movido, editado, etc.)';
COMMENT ON COLUMN public.activities.type IS 'Tipo do evento: created | moved | edited | starred | checklist | etc.';


-- 4.6 Comments (texto livre por card)
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_task_id ON public.comments(task_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_own" ON public.comments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.comments IS 'Comentários em texto livre por card';


-- 4.7 Time logs (log de horas trabalhadas por card)
CREATE TABLE public.time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  minutes integer NOT NULL CHECK (minutes > 0),
  note text,
  logged_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_logs_task_id ON public.time_logs(task_id);
CREATE INDEX idx_time_logs_user_id ON public.time_logs(user_id);

ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_logs_select_own" ON public.time_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "time_logs_insert_own" ON public.time_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "time_logs_update_own" ON public.time_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "time_logs_delete_own" ON public.time_logs
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.time_logs IS 'Registros de tempo trabalhado por card (em minutos)';
