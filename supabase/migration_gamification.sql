-- ================================================================
-- MIGRAZIONE: Commenti task + Sistema XP/Badge (Gamification)
-- Da eseguire nel SQL Editor di Supabase
-- ================================================================

-- 1. Commenti sulle task
CREATE TABLE IF NOT EXISTS public.task_commenti (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  socio_id   uuid REFERENCES public.soci(id) ON DELETE SET NULL,
  socio_nome text NOT NULL,
  testo      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.task_commenti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticati possono gestire commenti"
  ON public.task_commenti FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indice per fetch veloce dei commenti di una task
CREATE INDEX IF NOT EXISTS idx_task_commenti_task_id ON public.task_commenti(task_id);

-- 2. Log XP (fonte di verità, append-only)
CREATE TABLE IF NOT EXISTS public.xp_log (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  socio_id   uuid REFERENCES public.soci(id) ON DELETE CASCADE,
  azione     text NOT NULL,  -- task_completata | task_24h | commento_scritto | progetto_completato
  punti      int  NOT NULL DEFAULT 0,
  ref_id     uuid,           -- FK opzionale: id della task/progetto collegato
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticati possono gestire xp"
  ON public.xp_log FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_xp_log_socio_id ON public.xp_log(socio_id);

-- 3. Badge sbloccati per socio
CREATE TABLE IF NOT EXISTS public.badge_sbloccati (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  socio_id     uuid NOT NULL REFERENCES public.soci(id) ON DELETE CASCADE,
  badge_id     text NOT NULL,
  sbloccato_at timestamptz DEFAULT now(),
  UNIQUE(socio_id, badge_id)
);

ALTER TABLE public.badge_sbloccati ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticati possono gestire badge"
  ON public.badge_sbloccati FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
