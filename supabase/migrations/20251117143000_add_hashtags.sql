-- ABOUTME: Create hashtags system for content discovery
-- ABOUTME: Supports hashtag extraction, trending, and search

-- =============================================
-- CREATE HASHTAGS TABLE
-- =============================================

CREATE TABLE public.hashtags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT tag_format CHECK (tag ~ '^[a-z0-9_]+$'),
  CONSTRAINT tag_not_empty CHECK (LENGTH(tag) > 0),
  CONSTRAINT tag_max_length CHECK (LENGTH(tag) <= 100)
);

-- =============================================
-- CREATE POST_HASHTAGS JUNCTION TABLE
-- =============================================

CREATE TABLE public.post_hashtags (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (post_id, hashtag_id)
);

-- =============================================
-- CREATE MATERIALIZED VIEW FOR TRENDING HASHTAGS
-- =============================================

CREATE MATERIALIZED VIEW public.trending_hashtags AS
SELECT
  h.id,
  h.tag,
  COUNT(ph.post_id) as post_count,
  COUNT(DISTINCT ph.post_id) FILTER (WHERE p.created_at > NOW() - INTERVAL '24 hours') as recent_count,
  MAX(p.created_at) as last_used_at
FROM public.hashtags h
LEFT JOIN public.post_hashtags ph ON ph.hashtag_id = h.id
LEFT JOIN public.posts p ON p.id = ph.post_id
GROUP BY h.id, h.tag
ORDER BY recent_count DESC, post_count DESC
LIMIT 100;

-- Create index for fast refresh
CREATE UNIQUE INDEX idx_trending_hashtags_id ON public.trending_hashtags(id);

-- =============================================
-- INDEXES
-- =============================================

-- Index for hashtag lookups
CREATE INDEX idx_hashtags_tag ON public.hashtags(tag);

-- Index for finding posts by hashtag
CREATE INDEX idx_post_hashtags_hashtag ON public.post_hashtags(hashtag_id, created_at DESC);

-- Index for finding hashtags by post
CREATE INDEX idx_post_hashtags_post ON public.post_hashtags(post_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to refresh trending hashtags materialized view
CREATE OR REPLACE FUNCTION refresh_trending_hashtags()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.trending_hashtags;
END;
$$ LANGUAGE plpgsql;

-- Function to extract and store hashtags from post content
CREATE OR REPLACE FUNCTION extract_post_hashtags()
RETURNS TRIGGER AS $$
DECLARE
  hashtag_text TEXT;
  hashtag_record RECORD;
  matches TEXT[];
BEGIN
  -- Extract hashtags from content using regex
  matches := ARRAY(
    SELECT LOWER(substring(match, 2))
    FROM regexp_matches(NEW.content, '#([a-zA-Z]\w*)', 'g') AS match
  );

  -- Remove old hashtags if updating
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM public.post_hashtags WHERE post_id = NEW.id;
  END IF;

  -- Insert new hashtags
  FOREACH hashtag_text IN ARRAY matches
  LOOP
    -- Insert hashtag if it doesn't exist
    INSERT INTO public.hashtags (tag)
    VALUES (hashtag_text)
    ON CONFLICT (tag) DO NOTHING;

    -- Get the hashtag id
    SELECT id INTO hashtag_record FROM public.hashtags WHERE tag = hashtag_text;

    -- Link post to hashtag
    INSERT INTO public.post_hashtags (post_id, hashtag_id)
    VALUES (NEW.id, hashtag_record.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to automatically extract hashtags when post is created/updated
CREATE TRIGGER extract_hashtags_on_post
AFTER INSERT OR UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION extract_post_hashtags();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

-- Everyone can view hashtags
CREATE POLICY "Hashtags are viewable by everyone"
ON public.hashtags FOR SELECT
TO authenticated
USING (true);

-- Everyone can view post-hashtag relationships
CREATE POLICY "Post hashtags are viewable by everyone"
ON public.post_hashtags FOR SELECT
TO authenticated
USING (true);

-- System creates hashtags (via trigger)
CREATE POLICY "System can insert hashtags"
ON public.hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- System creates post-hashtag relationships (via trigger)
CREATE POLICY "System can insert post hashtags"
ON public.post_hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================
-- SCHEDULED REFRESH (Manual for now)
-- =============================================

-- To refresh trending hashtags, run:
-- SELECT refresh_trending_hashtags();
-- This should be scheduled to run every hour in production

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Hashtags: Stores unique hashtags
-- Post Hashtags: Many-to-many relationship between posts and hashtags
-- Trending Hashtags: Materialized view for fast trending queries
-- Trigger: Automatically extracts hashtags when posts are created/updated
