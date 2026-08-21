-- ==============================================================================
-- Aven Supabase Migration: Add sort_index to grade_categories & Reload Schema Cache
-- ==============================================================================

-- Step 1: Ensure sort_index exists on public.grade_categories
ALTER TABLE public.grade_categories 
ADD COLUMN IF NOT EXISTS sort_index INTEGER NOT NULL DEFAULT 0;

-- Step 2: Force PostgREST to reload its cached schema immediately
-- (Without this, Supabase API continues returning 'column does not exist' until restart)
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify the columns on grade_categories (check the output table below)
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'grade_categories'
ORDER BY ordinal_position;
