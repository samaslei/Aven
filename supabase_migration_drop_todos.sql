-- ==============================================================================
-- Aven Supabase Migration: Drop todos table & reload schema cache (Prompt 70)
-- ==============================================================================

-- Drop the todos table and any cascading objects/policies
DROP TABLE IF EXISTS public.todos CASCADE;

-- Force Supabase PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
