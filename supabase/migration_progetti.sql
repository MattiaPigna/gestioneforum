-- ================================================================
-- MIGRAZIONE: Tabella progetti + colonna progetto_id in tasks
-- Da eseguire nel SQL Editor di Supabase
-- ================================================================

-- 1. Crea la tabella progetti
CREATE TABLE IF NOT EXISTS public.progetti (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome            text NOT NULL,
  descrizione     text,
  budget          numeric(12, 2),
  speso           numeric(12, 2) DEFAULT 0,
  capo_progetto   text,
  stato           text DEFAULT 'Attivo',   -- Attivo | In Pausa | Completato | Archiviato
  acquisti        jsonb DEFAULT '[]'::jsonb, -- [{id, testo, fatto}]
  note            text,
  scadenza        date,
  created_at      timestamptz DEFAULT now()
);

-- 2. Aggiungi progetto_id alla tabella tasks (nullable → task generale se NULL)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS progetto_id uuid
  REFERENCES public.progetti(id) ON DELETE SET NULL;

-- 3. RLS: abilita e replica le policy già esistenti su tasks
ALTER TABLE public.progetti ENABLE ROW LEVEL SECURITY;

-- Lettura: tutti gli autenticati
CREATE POLICY "Tutti possono leggere i progetti"
  ON public.progetti FOR SELECT
  TO authenticated
  USING (true);

-- Scrittura: tutti gli autenticati (puoi restringere in base al ruolo se necessario)
CREATE POLICY "Autenticati possono modificare i progetti"
  ON public.progetti FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
