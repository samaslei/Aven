-- ==============================================================================
-- Supabase Security Advisor Hardening Migration
-- Run this in your Supabase Dashboard -> SQL Editor to resolve all 6 advisor warnings.
-- ==============================================================================

-- 1 & 5. Fix search_path on handle_new_user() and restrict execution to trigger-only
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

-- Revoke handle_new_user execute privileges from clients (trigger-only)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;


-- 2, 3, & 4. Harden delete_user_account(): set search_path, scope strictly to auth.uid(), revoke from anon/public
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

  -- Delete from auth.users (cascades to all user tables)
  DELETE FROM auth.users WHERE id = current_uid;
END;
$$;

-- Revoke execute from public/anon, grant strictly to authenticated users
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
