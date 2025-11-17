-- ABOUTME: Optimize database indexes for performance
-- ABOUTME: Add composite indexes for common queries and remove redundant ones

-- =============================================
-- POSTS TABLE OPTIMIZATIONS
-- =============================================

-- Composite index for feed queries (user + created_at for pagination)
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts(user_id, created_at DESC);

-- Composite index for replies (reply_to + created_at)
CREATE INDEX IF NOT EXISTS idx_posts_replies ON public.posts(reply_to_id, created_at DESC) WHERE reply_to_id IS NOT NULL;

-- Index for quote tweets
CREATE INDEX IF NOT EXISTS idx_posts_quotes ON public.posts(quote_of_id, created_at DESC) WHERE quote_of_id IS NOT NULL;

-- =============================================
-- LIKES TABLE OPTIMIZATIONS
-- =============================================

-- Composite index for checking if user liked post and counting likes
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON public.likes(post_id, user_id);

-- Index for user's liked posts page
CREATE INDEX IF NOT EXISTS idx_likes_user_created ON public.likes(user_id, created_at DESC);

-- =============================================
-- RETWEETS TABLE OPTIMIZATIONS
-- =============================================

-- Composite index for checking if user retweeted and counting retweets
CREATE INDEX IF NOT EXISTS idx_retweets_post_user ON public.retweets(post_id, user_id);

-- Index for user's retweets page
CREATE INDEX IF NOT EXISTS idx_retweets_user_created ON public.retweets(user_id, created_at DESC);

-- =============================================
-- FOLLOWS TABLE OPTIMIZATIONS
-- =============================================

-- Composite index for follower queries (who follows X)
CREATE INDEX IF NOT EXISTS idx_follows_following_created ON public.follows(following_id, created_at DESC);

-- Composite index for following queries (who does X follow)
CREATE INDEX IF NOT EXISTS idx_follows_follower_created ON public.follows(follower_id, created_at DESC);

-- Composite index for checking follow relationship
CREATE INDEX IF NOT EXISTS idx_follows_relationship ON public.follows(follower_id, following_id);

-- =============================================
-- PROFILES TABLE OPTIMIZATIONS
-- =============================================

-- Index for username lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));

-- Index for display name search
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower ON public.profiles(LOWER(display_name)) WHERE display_name IS NOT NULL;

-- Full-text search index for profile search
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public.profiles USING GIN(
  to_tsvector('english', COALESCE(display_name, '') || ' ' || username || ' ' || COALESCE(bio, ''))
);

-- =============================================
-- NOTIFICATIONS TABLE OPTIMIZATIONS
-- =============================================

-- Composite index for user's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, read, created_at DESC);

-- Index for notification type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON public.notifications(recipient_id, type, created_at DESC);

-- =============================================
-- MESSAGES TABLE OPTIMIZATIONS
-- =============================================

-- Already has idx_messages_conversation_created from original migration
-- Composite index for sender's sent messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON public.messages(sender_id, created_at DESC);

-- =============================================
-- HASHTAGS TABLE OPTIMIZATIONS
-- =============================================

-- Composite index for hashtag post count queries
CREATE INDEX IF NOT EXISTS idx_post_hashtags_tag_created ON public.post_hashtags(hashtag_id, created_at DESC);

-- =============================================
-- BOOKMARKS TABLE OPTIMIZATIONS
-- =============================================

-- Already has idx_bookmarks_user_created from original migration
-- Composite index for checking if post is bookmarked
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_user ON public.bookmarks(post_id, user_id);

-- =============================================
-- ANALYZE TABLES
-- =============================================

-- Update table statistics for query planner
ANALYZE public.posts;
ANALYZE public.profiles;
ANALYZE public.likes;
ANALYZE public.retweets;
ANALYZE public.follows;
ANALYZE public.notifications;
ANALYZE public.messages;
ANALYZE public.hashtags;
ANALYZE public.post_hashtags;
ANALYZE public.bookmarks;

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Composite indexes speed up queries that filter on multiple columns
-- GIN indexes enable fast full-text search
-- Partial indexes (WHERE clause) save space for conditional queries
-- ANALYZE updates statistics for the query planner to choose optimal execution plans
