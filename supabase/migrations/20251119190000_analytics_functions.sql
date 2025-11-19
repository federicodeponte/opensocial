-- ABOUTME: Analytics functions and views (FREE - PostgreSQL only)
-- ABOUTME: User stats, post analytics, engagement metrics, follower growth

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

-- Get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_posts', (
      SELECT COUNT(*)
      FROM posts
      WHERE user_id = user_uuid
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'total_likes_received', (
      SELECT COUNT(*)
      FROM likes l
      JOIN posts p ON p.id = l.post_id
      WHERE p.user_id = user_uuid
      AND l.created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'total_followers', (
      SELECT followers_count
      FROM profiles
      WHERE id = user_uuid
    ),
    'total_following', (
      SELECT following_count
      FROM profiles
      WHERE id = user_uuid
    ),
    'total_views', (
      SELECT COALESCE(SUM(view_count), 0)
      FROM post_views pv
      JOIN posts p ON p.id = pv.post_id
      WHERE p.user_id = user_uuid
      AND pv.viewed_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'engagement_rate', (
      SELECT CASE
        WHEN COUNT(p.id) > 0 THEN
          ROUND((COUNT(DISTINCT l.id)::DECIMAL / COUNT(p.id)::DECIMAL) * 100, 2)
        ELSE 0
      END
      FROM posts p
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE p.user_id = user_uuid
      AND p.created_at >= NOW() - (days_back || ' days')::INTERVAL
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get follower growth over time
CREATE OR REPLACE FUNCTION get_follower_growth(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE(date DATE, follower_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(f.created_at) as date,
    COUNT(*) as follower_count
  FROM follows f
  WHERE f.following_id = user_uuid
  AND f.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(f.created_at)
  ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql;

-- Get post performance metrics
CREATE OR REPLACE FUNCTION get_post_analytics(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  post_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  likes_count INTEGER,
  replies_count INTEGER,
  retweets_count INTEGER,
  views_count BIGINT,
  engagement_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as post_id,
    p.content,
    p.created_at,
    p.likes_count,
    p.replies_count,
    p.retweets_count,
    COALESCE(pv.view_count, 0) as views_count,
    ROUND(
      (p.likes_count + p.replies_count + p.retweets_count)::DECIMAL /
      NULLIF(COALESCE(pv.view_count, 1), 0)::DECIMAL * 100,
      2
    ) as engagement_score
  FROM posts p
  LEFT JOIN (
    SELECT post_id, SUM(view_count) as view_count
    FROM post_views
    GROUP BY post_id
  ) pv ON pv.post_id = p.id
  WHERE p.user_id = user_uuid
  AND p.created_at >= NOW() - (days_back || ' days')::INTERVAL
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get daily post activity
CREATE OR REPLACE FUNCTION get_daily_activity(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE(date DATE, post_count BIGINT, like_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(p.created_at) as date,
    COUNT(DISTINCT p.id) as post_count,
    COUNT(DISTINCT l.id) as like_count
  FROM posts p
  LEFT JOIN likes l ON l.post_id = p.id AND DATE(l.created_at) = DATE(p.created_at)
  WHERE p.user_id = user_uuid
  AND p.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(p.created_at)
  ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql;

-- Get top performing posts
CREATE OR REPLACE FUNCTION get_top_posts(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  post_id UUID,
  content TEXT,
  total_engagement INTEGER,
  likes INTEGER,
  retweets INTEGER,
  replies INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as post_id,
    p.content,
    (p.likes_count + p.retweets_count + p.replies_count) as total_engagement,
    p.likes_count as likes,
    p.retweets_count as retweets,
    p.replies_count as replies
  FROM posts p
  WHERE p.user_id = user_uuid
  ORDER BY total_engagement DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Get engagement breakdown by hour of day
CREATE OR REPLACE FUNCTION get_hourly_engagement(user_uuid UUID)
RETURNS TABLE(hour INTEGER, engagement_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM l.created_at)::INTEGER as hour,
    COUNT(*) as engagement_count
  FROM likes l
  JOIN posts p ON p.id = l.post_id
  WHERE p.user_id = user_uuid
  GROUP BY EXTRACT(HOUR FROM l.created_at)
  ORDER BY hour ASC;
END;
$$ LANGUAGE plpgsql;

-- Get audience demographics (followers' activity)
CREATE OR REPLACE FUNCTION get_audience_activity(user_uuid UUID)
RETURNS TABLE(
  active_followers BIGINT,
  engagement_rate DECIMAL,
  avg_likes_per_follower DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT f.follower_id) as active_followers,
    ROUND(
      COUNT(DISTINCT l.id)::DECIMAL /
      NULLIF(COUNT(DISTINCT f.follower_id), 0)::DECIMAL * 100,
      2
    ) as engagement_rate,
    ROUND(
      COUNT(l.id)::DECIMAL /
      NULLIF(COUNT(DISTINCT f.follower_id), 0)::DECIMAL,
      2
    ) as avg_likes_per_follower
  FROM follows f
  LEFT JOIN likes l ON l.user_id = f.follower_id
  LEFT JOIN posts p ON p.id = l.post_id AND p.user_id = user_uuid
  WHERE f.following_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- MATERIALIZED VIEWS FOR FASTER ANALYTICS
-- =============================================

-- Drop existing views if they exist
DROP MATERIALIZED VIEW IF EXISTS user_analytics_summary CASCADE;

-- Create materialized view for user analytics
CREATE MATERIALIZED VIEW user_analytics_summary AS
SELECT
  p.id as user_id,
  p.username,
  p.followers_count,
  p.following_count,
  COUNT(DISTINCT po.id) as total_posts,
  COALESCE(SUM(po.likes_count), 0) as total_likes,
  COALESCE(SUM(po.retweets_count), 0) as total_retweets,
  COALESCE(SUM(po.replies_count), 0) as total_replies,
  ROUND(
    COALESCE(SUM(po.likes_count + po.retweets_count + po.replies_count)::DECIMAL, 0) /
    NULLIF(COUNT(DISTINCT po.id), 0)::DECIMAL,
    2
  ) as avg_engagement_per_post
FROM profiles p
LEFT JOIN posts po ON po.user_id = p.id
GROUP BY p.id, p.username, p.followers_count, p.following_count;

-- Create index on materialized view
CREATE INDEX idx_user_analytics_user_id ON user_analytics_summary(user_id);

-- Function to refresh analytics
CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ANALYTICS EXPORT FUNCTIONS
-- =============================================

-- Export user analytics as CSV-ready JSON
CREATE OR REPLACE FUNCTION export_user_analytics(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT
      p.id,
      p.content,
      p.created_at,
      p.likes_count,
      p.retweets_count,
      p.replies_count,
      COALESCE(pv.view_count, 0) as views
    FROM posts p
    LEFT JOIN (
      SELECT post_id, SUM(view_count) as view_count
      FROM post_views
      GROUP BY post_id
    ) pv ON pv.post_id = p.id
    WHERE p.user_id = user_uuid
    AND p.created_at >= NOW() - (days_back || ' days')::INTERVAL
    ORDER BY p.created_at DESC
  ) t;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SCHEDULED REFRESH (Optional - for production)
-- =============================================

-- This would be called by a cron job or scheduled task
-- For now, we'll refresh on-demand via API
-- In production, consider pg_cron extension

COMMENT ON FUNCTION get_user_analytics IS 'Get comprehensive user analytics summary';
COMMENT ON FUNCTION get_follower_growth IS 'Track follower growth over time';
COMMENT ON FUNCTION get_post_analytics IS 'Detailed analytics for all user posts';
COMMENT ON FUNCTION refresh_analytics IS 'Refresh materialized analytics views';
