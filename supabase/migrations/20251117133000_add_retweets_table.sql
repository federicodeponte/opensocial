-- ABOUTME: Add retweets table for tracking retweets and quote tweets
-- ABOUTME: Includes triggers to auto-update retweet counts on posts table

-- =============================================
-- RETWEETS TABLE
-- =============================================
-- Tracks both pure retweets and quote tweets
-- If quote_content is NULL, it's a pure retweet
-- If quote_content has value, it's a quote tweet with commentary

CREATE TABLE public.retweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  quote_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- User can only retweet a post once (prevents duplicate retweets)
  CONSTRAINT unique_user_post_retweet UNIQUE (user_id, post_id),

  -- Quote content length validation (same as regular posts)
  CONSTRAINT quote_content_length CHECK (
    quote_content IS NULL OR
    (char_length(quote_content) >= 1 AND char_length(quote_content) <= 280)
  )
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Index for finding retweets by user
CREATE INDEX retweets_user_id_idx ON public.retweets(user_id);

-- Index for finding retweets of a specific post
CREATE INDEX retweets_post_id_idx ON public.retweets(post_id);

-- Index for chronological ordering
CREATE INDEX retweets_created_at_idx ON public.retweets(created_at DESC);

-- Composite index for checking if user retweeted a post (for UI state)
CREATE INDEX retweets_user_post_idx ON public.retweets(user_id, post_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.retweets ENABLE ROW LEVEL SECURITY;

-- Retweets are viewable by everyone
CREATE POLICY "Retweets are viewable by everyone"
  ON public.retweets FOR SELECT
  USING (true);

-- Authenticated users can create retweets
CREATE POLICY "Authenticated users can create retweets"
  ON public.retweets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own retweets (unretweet)
CREATE POLICY "Users can delete their own retweets"
  ON public.retweets FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS FOR RETWEET COUNTS
-- =============================================

-- Function: Update retweet count on posts when retweet is created/deleted
CREATE OR REPLACE FUNCTION update_retweet_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment retweet count
    UPDATE public.posts
    SET retweets_count = retweets_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement retweet count (never go below 0)
    UPDATE public.posts
    SET retweets_count = GREATEST(retweets_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update retweet counts
CREATE TRIGGER retweet_count_trigger
  AFTER INSERT OR DELETE ON public.retweets
  FOR EACH ROW
  EXECUTE FUNCTION update_retweet_count();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function: Check if user has retweeted a post
CREATE OR REPLACE FUNCTION user_has_retweeted(p_user_id UUID, p_post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.retweets
    WHERE user_id = p_user_id AND post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get retweet details for a user and post (returns quote_content if exists)
CREATE OR REPLACE FUNCTION get_user_retweet(p_user_id UUID, p_post_id UUID)
RETURNS public.retweets AS $$
  SELECT * FROM public.retweets
  WHERE user_id = p_user_id AND post_id = p_post_id
  LIMIT 1;
$$ LANGUAGE sql STABLE;
