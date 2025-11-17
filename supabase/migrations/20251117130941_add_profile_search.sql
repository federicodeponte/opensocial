-- ABOUTME: Add full-text search capabilities to profiles for efficient user discovery
-- ABOUTME: Uses PostgreSQL tsvector with GIN index for production-grade search performance

-- =============================================
-- ADD SEARCH VECTOR COLUMN
-- =============================================

-- Add tsvector column for full-text search
ALTER TABLE public.profiles
ADD COLUMN search_vector tsvector;

-- =============================================
-- CREATE GIN INDEX FOR FAST SEARCH
-- =============================================

-- GIN index is optimized for tsvector full-text search
-- Much faster than ILIKE '%pattern%' which requires full table scan
CREATE INDEX profiles_search_vector_idx
ON public.profiles
USING GIN (search_vector);

-- =============================================
-- FUNCTION TO UPDATE SEARCH VECTOR
-- =============================================

-- Function to generate search vector from profile fields
-- Weights: A (highest) for username, B for display_name, C for bio
-- This allows ranking by relevance
CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER TO AUTO-UPDATE SEARCH VECTOR
-- =============================================

-- Automatically update search_vector when profile is inserted or updated
CREATE TRIGGER profile_search_vector_update
  BEFORE INSERT OR UPDATE OF username, display_name, bio
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_search_vector();

-- =============================================
-- BACKFILL EXISTING PROFILES
-- =============================================

-- Update search_vector for all existing profiles
UPDATE public.profiles
SET search_vector =
  setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(display_name, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(bio, '')), 'C');

-- =============================================
-- ADDITIONAL INDEXES FOR SUGGESTED USERS
-- =============================================

-- Index for sorting by followers (suggested users feature)
-- Already exists but ensuring it's there
-- CREATE INDEX IF NOT EXISTS profiles_followers_count_idx
-- ON public.profiles(followers_count DESC);

-- Composite index for recent active users with followers
CREATE INDEX profiles_followers_created_idx
ON public.profiles(followers_count DESC, created_at DESC);

-- =============================================
-- RPC FUNCTIONS FOR SEARCH
-- =============================================

-- Function: Search profiles using full-text search with ranking
CREATE OR REPLACE FUNCTION public.search_profiles(
  search_query text,
  result_limit integer DEFAULT 20,
  result_offset integer DEFAULT 0
)
RETURNS SETOF public.profiles AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.profiles
  WHERE search_vector @@ to_tsquery('english', search_query)
  ORDER BY
    ts_rank(search_vector, to_tsquery('english', search_query)) DESC,
    followers_count DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get suggested profiles (popular users not followed by current user)
CREATE OR REPLACE FUNCTION public.get_suggested_profiles(
  current_user_id uuid,
  result_limit integer DEFAULT 10
)
RETURNS SETOF public.profiles AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  WHERE p.id != current_user_id
    AND p.id NOT IN (
      SELECT following_id
      FROM public.follows
      WHERE follower_id = current_user_id
    )
  ORDER BY
    p.followers_count DESC,
    p.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
