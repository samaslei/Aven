-- ==============================================================================
-- Supabase Migration: Self-Service User Account Deletion Function
-- Copy & paste this into your Supabase Dashboard -> SQL Editor and click RUN.
-- ==============================================================================

-- 1. Create the RPC function that deletes the authenticated user from auth.users
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_uid uuid;
BEGIN
  -- Retrieve the UID of the currently authenticated caller from JWT
  current_uid := auth.uid();

  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Cannot delete account.';
  END IF;

  -- Delete from auth.users
  -- Because profiles, subjects, sessions, grades, plans, and settings have
  -- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  -- this single DELETE statement completely removes the auth user and all associated data.
  DELETE FROM auth.users WHERE id = current_uid;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
