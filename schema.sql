-- ==============================================================================
-- Aven Database Schema for Supabase
-- Mirrors the existing store.js data model with Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  bio TEXT,
  year_level TEXT DEFAULT '1st Year',
  school TEXT,
  program TEXT,
  avatar_color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. SUBJECTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  year_level TEXT DEFAULT '1st Year',
  semester TEXT DEFAULT '1st Semester',
  color TEXT DEFAULT '#6366f1',
  instructor TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  archive_reason TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. STUDY SESSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure subject_id is nullable on existing tables to allow general study sessions
ALTER TABLE public.study_sessions ALTER COLUMN subject_id DROP NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. GRADE CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grade_categories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term TEXT NOT NULL, -- e.g. 'Midterm', 'Final'
  category TEXT NOT NULL, -- e.g. 'Quizzes', 'Laboratory', 'Term Exams'
  weight NUMERIC NOT NULL DEFAULT 0,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure sort_index exists for existing tables
ALTER TABLE public.grade_categories ADD COLUMN IF NOT EXISTS sort_index INTEGER NOT NULL DEFAULT 0;

-- ------------------------------------------------------------------------------
-- 5. GRADE ENTRIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grade_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES public.grade_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  out_of NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 6. SUBJECT GRADE CONFIGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subject_grade_configs (
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  midterm_weight NUMERIC NOT NULL DEFAULT 50,
  final_weight NUMERIC NOT NULL DEFAULT 50,
  PRIMARY KEY (subject_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 7. STUDY PLANS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_plans (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT,
  html_content TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure subject_id is nullable for general/standalone plans
ALTER TABLE public.study_plans ALTER COLUMN subject_id DROP NOT NULL;

-- ------------------------------------------------------------------------------
-- 8. SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  term_weight_default NUMERIC DEFAULT 50,
  timer_mode_default TEXT DEFAULT 'stopwatch',
  pomodoro_work INTEGER DEFAULT 25,
  pomodoro_break INTEGER DEFAULT 5,
  pomodoro_long_break INTEGER DEFAULT 15,
  pomodoro_long_break_interval INTEGER DEFAULT 4,
  pomodoro_auto_start_breaks BOOLEAN DEFAULT false,
  pomodoro_auto_start_pomodoros BOOLEAN DEFAULT false,
  notification_sound BOOLEAN DEFAULT true,
  subjects_view_mode TEXT DEFAULT 'grid',
  neutral_colors BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_subjects_user ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON public.study_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_grade_categories_user ON public.grade_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_grade_categories_subject ON public.grade_categories(subject_id);
CREATE INDEX IF NOT EXISTS idx_grade_categories_sort ON public.grade_categories(user_id, subject_id, term, sort_index);
CREATE INDEX IF NOT EXISTS idx_grade_entries_user ON public.grade_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_grade_entries_category ON public.grade_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_subject_grade_configs_user ON public.subject_grade_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON public.study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_subject ON public.study_plans(subject_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- All tables are strictly scoped to auth.uid() = user_id
-- ==============================================================================

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subjects" ON public.subjects;
CREATE POLICY "Users can view own subjects" ON public.subjects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subjects" ON public.subjects;
CREATE POLICY "Users can insert own subjects" ON public.subjects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subjects" ON public.subjects;
CREATE POLICY "Users can update own subjects" ON public.subjects
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subjects" ON public.subjects;
CREATE POLICY "Users can delete own subjects" ON public.subjects
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Study Sessions
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own study sessions" ON public.study_sessions;
CREATE POLICY "Users can view own study sessions" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own study sessions" ON public.study_sessions;
CREATE POLICY "Users can insert own study sessions" ON public.study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own study sessions" ON public.study_sessions;
CREATE POLICY "Users can update own study sessions" ON public.study_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own study sessions" ON public.study_sessions;
CREATE POLICY "Users can delete own study sessions" ON public.study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Grade Categories
ALTER TABLE public.grade_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own grade categories" ON public.grade_categories;
CREATE POLICY "Users can view own grade categories" ON public.grade_categories
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own grade categories" ON public.grade_categories;
CREATE POLICY "Users can insert own grade categories" ON public.grade_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own grade categories" ON public.grade_categories;
CREATE POLICY "Users can update own grade categories" ON public.grade_categories
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own grade categories" ON public.grade_categories;
CREATE POLICY "Users can delete own grade categories" ON public.grade_categories
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Grade Entries
ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own grade entries" ON public.grade_entries;
CREATE POLICY "Users can view own grade entries" ON public.grade_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own grade entries" ON public.grade_entries;
CREATE POLICY "Users can insert own grade entries" ON public.grade_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own grade entries" ON public.grade_entries;
CREATE POLICY "Users can update own grade entries" ON public.grade_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own grade entries" ON public.grade_entries;
CREATE POLICY "Users can delete own grade entries" ON public.grade_entries
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Subject Grade Configs
ALTER TABLE public.subject_grade_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subject grade configs" ON public.subject_grade_configs;
CREATE POLICY "Users can view own subject grade configs" ON public.subject_grade_configs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subject grade configs" ON public.subject_grade_configs;
CREATE POLICY "Users can insert own subject grade configs" ON public.subject_grade_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subject grade configs" ON public.subject_grade_configs;
CREATE POLICY "Users can update own subject grade configs" ON public.subject_grade_configs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subject grade configs" ON public.subject_grade_configs;
CREATE POLICY "Users can delete own subject grade configs" ON public.subject_grade_configs
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Study Plans
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own study plans" ON public.study_plans;
CREATE POLICY "Users can view own study plans" ON public.study_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own study plans" ON public.study_plans;
CREATE POLICY "Users can insert own study plans" ON public.study_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own study plans" ON public.study_plans;
CREATE POLICY "Users can update own study plans" ON public.study_plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own study plans" ON public.study_plans;
CREATE POLICY "Users can delete own study plans" ON public.study_plans
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;
CREATE POLICY "Users can view own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.settings;
CREATE POLICY "Users can insert own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
CREATE POLICY "Users can update own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own settings" ON public.settings;
CREATE POLICY "Users can delete own settings" ON public.settings
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC USER PROFILES & SETTINGS TRIGGER (ON SIGN-UP)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Auto-create profile row
  INSERT INTO public.profiles (user_id, display_name, email, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    '#6366f1'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Auto-create default settings row
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Restrict handle_new_user() to internal trigger execution only
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ==============================================================================
-- 9. USER ACCOUNT SELF-DELETION FUNCTION (RPC)
-- Allows authenticated users to permanently delete their auth account & cascade data
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_uid uuid;
BEGIN
  -- Retrieve the UID of the currently authenticated caller strictly from JWT session
  current_uid := auth.uid();

  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Cannot delete account.';
  END IF;

  -- Delete strictly WHERE id = current_uid (scoped to calling user)
  DELETE FROM auth.users WHERE id = current_uid;
END;
$$;

-- Revoke default public/anon access and grant strictly to authenticated users
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ==============================================================================
-- 10. TODOS & DEADLINES TABLE (Prompt 56)
-- Stores student todo items and task deadlines linked to subjects
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.todos (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_todos_user ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due ON public.todos(user_id, due_date);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own todos" ON public.todos;
CREATE POLICY "Users can view own todos" ON public.todos
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own todos" ON public.todos;
CREATE POLICY "Users can insert own todos" ON public.todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
CREATE POLICY "Users can update own todos" ON public.todos
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;
CREATE POLICY "Users can delete own todos" ON public.todos
  FOR DELETE USING (auth.uid() = user_id);


