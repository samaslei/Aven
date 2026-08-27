-- ==============================================================================
-- Aven Supabase Migration: Update settings table with all missing columns
-- ==============================================================================

-- Step 1: Add all extended settings columns if they don't exist yet
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS pomodoro_long_break INTEGER DEFAULT 15;

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS pomodoro_long_break_interval INTEGER DEFAULT 4;

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS pomodoro_auto_start_breaks BOOLEAN DEFAULT false;

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS pomodoro_auto_start_pomodoros BOOLEAN DEFAULT false;

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS subjects_view_mode TEXT DEFAULT 'grid';

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS neutral_colors BOOLEAN DEFAULT false;

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Step 2: Force Supabase PostgREST to reload its cached schema immediately
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify all columns on the settings table
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'settings'
ORDER BY ordinal_position;
