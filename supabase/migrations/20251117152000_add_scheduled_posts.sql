-- ABOUTME: Add post scheduling functionality
-- ABOUTME: Users can schedule posts to be published at a future time

-- =============================================
-- CREATE SCHEDULED POSTS TABLE
-- =============================================

CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_urls TEXT[],
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'cancelled')),
  reply_to_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  error_message TEXT,

  CONSTRAINT scheduled_for_in_future CHECK (scheduled_for > NOW()),
  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  CONSTRAINT content_max_length CHECK (LENGTH(content) <= 280)
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for finding user's scheduled posts
CREATE INDEX idx_scheduled_posts_user ON public.scheduled_posts(user_id, scheduled_for ASC);

-- Index for finding pending posts to publish
CREATE INDEX idx_scheduled_posts_pending ON public.scheduled_posts(scheduled_for ASC)
WHERE status = 'pending';

-- Index for status filtering
CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts(user_id, status);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Users can view their own scheduled posts
CREATE POLICY "Users can view their own scheduled posts"
ON public.scheduled_posts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own scheduled posts
CREATE POLICY "Users can create scheduled posts"
ON public.scheduled_posts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own scheduled posts (only pending ones)
CREATE POLICY "Users can update pending scheduled posts"
ON public.scheduled_posts FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid());

-- Users can delete their own scheduled posts (only pending ones)
CREATE POLICY "Users can delete pending scheduled posts"
ON public.scheduled_posts FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending');

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to publish a scheduled post
CREATE OR REPLACE FUNCTION publish_scheduled_post(scheduled_post_id UUID)
RETURNS UUID AS $$
DECLARE
  v_scheduled_post RECORD;
  v_new_post_id UUID;
BEGIN
  -- Get the scheduled post
  SELECT * INTO v_scheduled_post
  FROM public.scheduled_posts
  WHERE id = scheduled_post_id
    AND status = 'pending'
    AND scheduled_for <= NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Scheduled post not found or not ready to publish';
  END IF;

  -- Create the actual post
  INSERT INTO public.posts (user_id, content, image_urls, reply_to_id)
  VALUES (
    v_scheduled_post.user_id,
    v_scheduled_post.content,
    v_scheduled_post.image_urls,
    v_scheduled_post.reply_to_id
  )
  RETURNING id INTO v_new_post_id;

  -- Update scheduled post status
  UPDATE public.scheduled_posts
  SET
    status = 'published',
    published_post_id = v_new_post_id
  WHERE id = scheduled_post_id;

  RETURN v_new_post_id;
EXCEPTION WHEN OTHERS THEN
  -- Mark as failed
  UPDATE public.scheduled_posts
  SET
    status = 'failed',
    error_message = SQLERRM
  WHERE id = scheduled_post_id;

  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Scheduled Posts: Posts to be published at a future time
-- Status: pending (awaiting publication), published (successfully posted),
--         failed (error during publication), cancelled (user cancelled)
-- A background job or Edge Function should call publish_scheduled_post()
-- for posts where scheduled_for <= NOW() and status = 'pending'
