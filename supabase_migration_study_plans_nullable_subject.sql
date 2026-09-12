-- ==============================================================================
-- Aven Supabase Migration: Make study_plans.subject_id Nullable
-- Allows interactive study plans to exist as standalone roadmaps without
-- requiring association to an academic subject.
--
-- How to apply:
-- Copy & paste this into your Supabase Dashboard -> SQL Editor and click RUN.
-- ==============================================================================

-- Step 1: Drop the NOT NULL constraint on subject_id in public.study_plans
ALTER TABLE public.study_plans 
ALTER COLUMN subject_id DROP NOT NULL;

-- Step 2: Verify foreign key behavior
-- In PostgreSQL, standard foreign keys (REFERENCES public.subjects(id))
-- naturally permit NULL values. When subject_id is NULL, the foreign key
-- check succeeds automatically.
-- Ensure foreign key cascades appropriately when a subject is deleted:
-- (Existing definition: subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE)

-- Step 3: Ensure index on subject_id exists for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_study_plans_subject 
ON public.study_plans(subject_id);

-- Step 4: Ensure RLS policies remain valid for unlinked plans
-- Existing RLS policies verify `auth.uid() = user_id`, which remains completely
-- functional and secure when subject_id is NULL.
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

-- Step 5: Force Supabase PostgREST to reload its schema cache immediately
-- This ensures the REST API stops enforcing the old NOT NULL constraint without delay.
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify the column is now nullable (is_nullable should show 'YES')
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'study_plans' 
  AND column_name = 'subject_id';
