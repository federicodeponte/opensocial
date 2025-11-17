-- ABOUTME: Add pinned post support for user profiles
-- ABOUTME: Allows users to pin one post to the top of their profile

-- =============================================
-- ADD PINNED POST COLUMN TO PROFILES
-- =============================================

-- Add column to track which post is pinned
ALTER TABLE public.profiles
ADD COLUMN pinned_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_profiles_pinned_post_id ON public.profiles(pinned_post_id);

-- =============================================
-- COMMENTS
-- =============================================

-- Users can only pin one post at a time
-- When a post is deleted, pinned_post_id is automatically set to NULL
-- Users can only pin their own posts (enforced at application level)
