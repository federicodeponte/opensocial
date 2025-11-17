-- ABOUTME: Materialized views for performance-critical queries
-- ABOUTME: Pre-computed views that cache expensive aggregations

-- =============================================
-- TRENDING POSTS MATERIALIZED VIEW
-- =============================================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS trending_posts_cache CASCADE;

-- Create materialized view for trending posts
-- Refreshed every 5 minutes via cron job or manual refresh
CREATE MATERIALIZED VIEW trending_posts_cache AS
SELECT
  p.id,
  p.user_id,
  p.content,
  p.created_at,
  p.image_urls,
  p.reply_to_id,
  p.quote_of_id,
  -- Pre-compute engagement counts
  COALESCE(like_counts.count, 0) AS likes_count,
  COALESCE(retweet_counts.count, 0) AS retweets_count,
  COALESCE(reply_counts.count, 0) AS replies_count,
  COALESCE(view_counts.count, 0) AS views_count,
  -- Calculate trending score
  (
    COALESCE(like_counts.count, 0) * 1.0 +
    COALESCE(retweet_counts.count, 0) * 2.0 +
    COALESCE(reply_counts.count, 0) * 1.5 +
    COALESCE(view_counts.count, 0) * 0.01
  ) * POW(2, -EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 21600) AS trending_score
FROM posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM likes
  GROUP BY post_id
) like_counts ON p.id = like_counts.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM retweets
  GROUP BY post_id
) retweet_counts ON p.id = retweet_counts.post_id
LEFT JOIN (
  SELECT reply_to_id, COUNT(*) as count
  FROM posts
  WHERE reply_to_id IS NOT NULL
  GROUP BY reply_to_id
) reply_counts ON p.id = reply_counts.reply_to_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM post_views
  GROUP BY post_id
) view_counts ON p.id = view_counts.post_id
WHERE
  p.created_at > NOW() - INTERVAL '7 days' -- Only last 7 days
  AND p.reply_to_id IS NULL -- Only top-level posts
ORDER BY trending_score DESC, p.created_at DESC;

-- Create index on trending score
CREATE INDEX idx_trending_posts_score ON trending_posts_cache(trending_score DESC, created_at DESC);

-- =============================================
-- USER STATS MATERIALIZED VIEW
-- =============================================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS user_stats_cache CASCADE;

-- Create materialized view for user statistics
CREATE MATERIALIZED VIEW user_stats_cache AS
SELECT
  p.id AS user_id,
  p.username,
  p.display_name,
  -- Pre-compute follower/following counts
  COALESCE(follower_counts.count, 0) AS followers_count,
  COALESCE(following_counts.count, 0) AS following_count,
  -- Pre-compute post counts
  COALESCE(post_counts.count, 0) AS posts_count,
  -- Pre-compute total engagement received
  COALESCE(likes_received.count, 0) AS total_likes_received,
  -- Last activity timestamp
  COALESCE(last_post.created_at, p.created_at) AS last_activity_at
FROM profiles p
LEFT JOIN (
  SELECT following_id, COUNT(*) as count
  FROM follows
  GROUP BY following_id
) follower_counts ON p.id = follower_counts.following_id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as count
  FROM follows
  GROUP BY follower_id
) following_counts ON p.id = following_counts.follower_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM posts
  GROUP BY user_id
) post_counts ON p.id = post_counts.user_id
LEFT JOIN (
  SELECT posts.user_id, COUNT(likes.id) as count
  FROM posts
  LEFT JOIN likes ON posts.id = likes.post_id
  GROUP BY posts.user_id
) likes_received ON p.id = likes_received.user_id
LEFT JOIN LATERAL (
  SELECT created_at
  FROM posts
  WHERE user_id = p.id
  ORDER BY created_at DESC
  LIMIT 1
) last_post ON true;

-- Create index on user stats
CREATE INDEX idx_user_stats_followers ON user_stats_cache(followers_count DESC);
CREATE INDEX idx_user_stats_activity ON user_stats_cache(last_activity_at DESC);

-- =============================================
-- REFRESH FUNCTION
-- =============================================

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts_cache;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats_cache;
END;
$$;

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- To manually refresh views:
-- SELECT refresh_performance_views();

-- To set up automatic refresh (requires pg_cron extension):
-- SELECT cron.schedule('refresh-views', '*/5 * * * *', 'SELECT refresh_performance_views();');

-- Note: CONCURRENTLY requires unique indexes, which we've created above
