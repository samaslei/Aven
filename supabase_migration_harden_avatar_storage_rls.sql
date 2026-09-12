-- ==============================================================================
-- Aven Database Migration: Harden Avatar Storage Bucket RLS
-- Fixes insecure storage.objects policies where any authenticated user could
-- overwrite or delete other users' avatars.
--
-- How to apply:
-- Copy & paste this script into your Supabase Dashboard -> SQL Editor and click RUN.
-- ==============================================================================

-- 1. Ensure the 'avatars' storage bucket exists and is public for read access
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing permissive policies on storage.objects for the avatars bucket
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their avatars" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Individuals can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Individuals can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Individuals can delete their own avatar" ON storage.objects;

-- 3. Ensure public read access to avatar images (anyone can view profile photos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Avatar images are publicly accessible'
  ) THEN
    CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- 4. Secure INSERT policy: Authenticated users can ONLY upload to their own user_id folder
-- e.g. `<auth.uid()>/avatar-<timestamp>.<ext>`
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Secure UPDATE policy: Authenticated users can ONLY update/overwrite files in their own user_id folder
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Secure DELETE policy: Authenticated users can ONLY delete files in their own user_id folder
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Verification helper: Query policies on storage.objects to confirm configuration
SELECT 
  policyname, 
  cmd, 
  roles,
  qual AS using_expression, 
  with_check AS with_check_expression
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname ILIKE '%avatar%');
