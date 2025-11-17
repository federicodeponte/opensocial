-- ABOUTME: Add Supabase Storage support for profile avatars and header images
-- ABOUTME: Includes storage bucket creation and RLS policies

-- =============================================
-- CREATE STORAGE BUCKETS FOR PROFILE IMAGES
-- =============================================

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name)
VALUES ('avatars', 'avatars')
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for profile headers
INSERT INTO storage.buckets (id, name)
VALUES ('headers', 'headers')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES FOR AVATARS
-- =============================================

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- STORAGE POLICIES FOR HEADERS
-- =============================================

-- Policy: Anyone can view headers (public bucket)
CREATE POLICY "Headers are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'headers');

-- Policy: Authenticated users can upload their own header
CREATE POLICY "Users can upload their own header"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'headers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own header
CREATE POLICY "Users can update their own header"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'headers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own header
CREATE POLICY "Users can delete their own header"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'headers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Avatar URL format: {userId}/avatar.{extension}
-- Header URL format: {userId}/header.{extension}
-- Maximum file size: 5MB (enforced at application level)
-- Supported formats: jpg, jpeg, png, gif, webp
-- Recommended sizes:
--   Avatar: 400x400px (square)
--   Header: 1500x500px (3:1 ratio)
