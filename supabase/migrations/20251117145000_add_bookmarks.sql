-- ABOUTME: Create bookmarks system for saving posts
-- ABOUTME: Users can bookmark posts for later reading

-- =============================================
-- CREATE BOOKMARKS TABLE
-- =============================================

CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_post_bookmark UNIQUE (user_id, post_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for finding user's bookmarks
CREATE INDEX idx_bookmarks_user_created ON public.bookmarks(user_id, created_at DESC);

-- Index for checking if post is bookmarked
CREATE INDEX idx_bookmarks_post_user ON public.bookmarks(post_id, user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.bookmarks FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own bookmarks
CREATE POLICY "Users can create their own bookmarks"
ON public.bookmarks FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
ON public.bookmarks FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Bookmarks: Save posts for later reading
-- Each user can bookmark a post only once (enforced by unique constraint)
-- Bookmarks are private (only visible to the user who created them)
