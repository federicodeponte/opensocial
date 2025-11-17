-- ABOUTME: Add mute and block functionality for users
-- ABOUTME: Muted users are hidden from feed, blocked users cannot interact

-- =============================================
-- CREATE MUTED USERS TABLE
-- =============================================

CREATE TABLE public.muted_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  muted_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- User cannot mute themselves
  CONSTRAINT cannot_mute_self CHECK (user_id != muted_user_id),
  -- One mute record per pair
  CONSTRAINT unique_mute UNIQUE (user_id, muted_user_id)
);

-- =============================================
-- CREATE BLOCKED USERS TABLE
-- =============================================

CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- User cannot block themselves
  CONSTRAINT cannot_block_self CHECK (user_id != blocked_user_id),
  -- One block record per pair
  CONSTRAINT unique_block UNIQUE (user_id, blocked_user_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for checking if user has muted someone
CREATE INDEX idx_muted_users_user ON public.muted_users(user_id);
CREATE INDEX idx_muted_users_muted ON public.muted_users(muted_user_id);

-- Index for checking if user has blocked someone
CREATE INDEX idx_blocked_users_user ON public.blocked_users(user_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own mute list
CREATE POLICY "Users can view their own mutes"
ON public.muted_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can mute other users
CREATE POLICY "Users can mute others"
ON public.muted_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can unmute
CREATE POLICY "Users can unmute"
ON public.muted_users FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Users can view their own block list
CREATE POLICY "Users can view their own blocks"
ON public.blocked_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can block other users
CREATE POLICY "Users can block others"
ON public.blocked_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can unblock
CREATE POLICY "Users can unblock"
ON public.blocked_users FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- FUNCTIONS TO AUTO-REMOVE FOLLOWS ON BLOCK
-- =============================================

CREATE OR REPLACE FUNCTION remove_follows_on_block()
RETURNS TRIGGER AS $$
BEGIN
  -- When user A blocks user B:
  -- 1. Remove A's follow of B
  DELETE FROM public.follows
  WHERE follower_id = NEW.user_id AND following_id = NEW.blocked_user_id;

  -- 2. Remove B's follow of A
  DELETE FROM public.follows
  WHERE follower_id = NEW.blocked_user_id AND following_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_remove_follows_on_block
AFTER INSERT ON public.blocked_users
FOR EACH ROW
EXECUTE FUNCTION remove_follows_on_block();

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Muted Users: User won't see muted user's posts in their feed
-- Blocked Users: Mutual blocking - neither can see or interact with each other
-- Blocking automatically removes follows in both directions
-- Users cannot mute or block themselves
