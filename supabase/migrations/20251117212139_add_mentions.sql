-- Add mentions table for @username mentions in posts
CREATE TABLE IF NOT EXISTS public.mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate mentions in same post
  CONSTRAINT unique_mention_per_post UNIQUE (post_id, mentioned_user_id)
);

-- Add indexes for performance
CREATE INDEX idx_mentions_post_id ON public.mentions(post_id);
CREATE INDEX idx_mentions_user_id ON public.mentions(mentioned_user_id);

-- Enable RLS
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view mentions
CREATE POLICY "Mentions are viewable by everyone"
  ON public.mentions FOR SELECT
  USING (true);

-- Only post author can create mentions when creating posts
CREATE POLICY "Post authors can create mentions"
  ON public.mentions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Only post author can delete mentions
CREATE POLICY "Post authors can delete mentions"
  ON public.mentions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Add verified column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Create index for verified users
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(verified) WHERE verified = true;

-- Add mentions count to notification types (update notifications table if needed)
-- This will be used later for mention notifications

COMMENT ON TABLE public.mentions IS 'Stores @username mentions in posts';
COMMENT ON COLUMN public.profiles.verified IS 'Whether the user has a verified badge';
