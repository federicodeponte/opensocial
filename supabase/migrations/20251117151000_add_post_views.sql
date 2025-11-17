-- ABOUTME: Add view tracking for posts
-- ABOUTME: Track unique views per user and total view counts

-- =============================================
-- CREATE POST VIEWS TABLE
-- =============================================

CREATE TABLE public.post_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),

  -- One view per user per post
  CONSTRAINT unique_post_view UNIQUE (post_id, user_id)
);

-- =============================================
-- ADD VIEW COUNT TO POSTS
-- =============================================

ALTER TABLE public.posts
ADD COLUMN views_count INTEGER DEFAULT 0 NOT NULL;

-- =============================================
-- INDEXES
-- =============================================

-- Index for counting views per post
CREATE INDEX idx_post_views_post ON public.post_views(post_id);

-- Index for user's viewed posts
CREATE INDEX idx_post_views_user ON public.post_views(user_id, viewed_at DESC);

-- =============================================
-- FUNCTION TO UPDATE VIEW COUNT
-- =============================================

CREATE OR REPLACE FUNCTION update_post_views_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the cached count on the post
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET views_count = views_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET views_count = GREATEST(views_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_post_views_count_trigger
AFTER INSERT OR DELETE ON public.post_views
FOR EACH ROW
EXECUTE FUNCTION update_post_views_count();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Users can view all post views (for analytics)
CREATE POLICY "Post views are viewable by everyone"
ON public.post_views FOR SELECT
TO authenticated
USING (true);

-- Users can record their own views
CREATE POLICY "Users can record their own views"
ON public.post_views FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own views
CREATE POLICY "Users can delete their own views"
ON public.post_views FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Post Views: Track unique views per user
-- views_count on posts is cached for performance
-- Constraint ensures one view per user per post
-- Trigger automatically updates cached count
