-- ABOUTME: Add image support to posts with Supabase Storage configuration
-- ABOUTME: Includes image_urls array column and storage bucket setup

-- =============================================
-- ADD IMAGE URLS COLUMN TO POSTS
-- =============================================

-- Add image_urls as TEXT array (stores up to 4 image URLs)
ALTER TABLE public.posts
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Add check constraint for maximum 4 images per post
ALTER TABLE public.posts
ADD CONSTRAINT max_4_images CHECK (array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 4);

-- =============================================
-- CREATE STORAGE BUCKET FOR POST IMAGES
-- =============================================

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name)
VALUES ('post-images', 'post-images')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES FOR POST IMAGES
-- =============================================

-- Policy: Anyone can view post images (public bucket)
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- Policy: Authenticated users can upload post images
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own post images
CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Image URL format: {userId}/{postId}/{imageIndex}.{extension}
-- Example: 550e8400-e29b-41d4-a716-446655440000/660e8400-e29b-41d4-a716-446655440001/0.jpg
-- Maximum 4 images per post (enforced by check constraint)
-- Supported formats: jpg, jpeg, png, gif, webp
-- Maximum file size: 5MB (enforced at application level)
