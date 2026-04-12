-- ================================================================
-- MIGRAZIONE: Aggiunge drive_id alla tabella drive
-- Necessario per collegare i file caricati tramite la Edge Function
-- ================================================================

ALTER TABLE public.drive
  ADD COLUMN IF NOT EXISTS drive_id text; -- ID del file su Google Drive (per riferimento/eliminazione futura)
