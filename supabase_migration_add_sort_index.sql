-- ==============================================================================
-- Aven Supabase Migration: Add sort_index to grade_categories & Reload Schema Cache
-- ==============================================================================

-- Step 1: Ensure sort_index column exists on public.grade_categories
ALTER TABLE public.grade_categories 
ADD COLUMN IF NOT EXISTS sort_index INTEGER NOT NULL DEFAULT 0;

-- Step 2: Backfill existing rows with a sensible default sequential order per subject & term
WITH ranked_categories AS (
  SELECT 
    id, 
    ROW_NUMBER() OVER (
      PARTITION BY subject_id, term 
      ORDER BY created_at ASC, id ASC
    ) - 1 AS new_sort
  FROM public.grade_categories
)
UPDATE public.grade_categories gc
SET sort_index = rc.new_sort
FROM ranked_categories rc
WHERE gc.id = rc.id;

-- Step 3: Create performance index for drag-and-drop category queries
CREATE INDEX IF NOT EXISTS idx_grade_categories_sort 
ON public.grade_categories(user_id, subject_id, term, sort_index);

-- Step 4: Force PostgREST to reload its cached schema immediately
-- (Without this, Supabase API continues returning 'column does not exist' until restart)
NOTIFY pgrst, 'reload schema';

-- Step 5: Verify the columns on grade_categories (check the output table below)
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'grade_categories'
ORDER BY ordinal_position;
