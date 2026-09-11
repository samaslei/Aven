-- ==============================================================================
-- Migration: Add composite indexes for high-frequency user_id + created_at queries
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_created 
  ON public.study_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subjects_user_created 
  ON public.subjects(user_id, created_at DESC);
