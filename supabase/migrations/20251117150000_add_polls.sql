-- ABOUTME: Create polls system for posts
-- ABOUTME: Users can create polls with multiple options and vote

-- =============================================
-- CREATE POLLS TABLE
-- =============================================

CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT expires_in_future CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- =============================================
-- CREATE POLL OPTIONS TABLE
-- =============================================

CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT option_text_not_empty CHECK (LENGTH(TRIM(option_text)) > 0),
  CONSTRAINT option_text_max_length CHECK (LENGTH(option_text) <= 100),
  CONSTRAINT position_positive CHECK (position >= 0),
  CONSTRAINT unique_poll_position UNIQUE (poll_id, position)
);

-- =============================================
-- CREATE POLL VOTES TABLE
-- =============================================

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_poll_vote UNIQUE (poll_id, user_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for finding poll by post
CREATE INDEX idx_polls_post ON public.polls(post_id);

-- Index for finding poll options
CREATE INDEX idx_poll_options_poll ON public.poll_options(poll_id, position ASC);

-- Index for counting votes per option
CREATE INDEX idx_poll_votes_option ON public.poll_votes(option_id);

-- Index for checking if user voted
CREATE INDEX idx_poll_votes_user_poll ON public.poll_votes(user_id, poll_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Everyone can view polls
CREATE POLICY "Polls are viewable by everyone"
ON public.polls FOR SELECT
TO authenticated
USING (true);

-- Users can create polls
CREATE POLICY "Users can create polls"
ON public.polls FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = polls.post_id
    AND user_id = auth.uid()
  )
);

-- Everyone can view poll options
CREATE POLICY "Poll options are viewable by everyone"
ON public.poll_options FOR SELECT
TO authenticated
USING (true);

-- Users can create poll options for their polls
CREATE POLICY "Users can create poll options"
ON public.poll_options FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.posts po ON po.id = p.post_id
    WHERE p.id = poll_options.poll_id
    AND po.user_id = auth.uid()
  )
);

-- Everyone can view poll votes (for transparency)
CREATE POLICY "Poll votes are viewable by everyone"
ON public.poll_votes FOR SELECT
TO authenticated
USING (true);

-- Users can vote on polls
CREATE POLICY "Users can vote on polls"
ON public.poll_votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own votes (change vote)
CREATE POLICY "Users can delete their own votes"
ON public.poll_votes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Polls: Attached to posts, optional expiration
-- Poll Options: 2-4 choices per poll
-- Poll Votes: One vote per user per poll (can be changed)
-- Constraint ensures users can only vote once per poll
-- Position field maintains option order
