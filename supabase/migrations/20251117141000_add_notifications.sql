-- ABOUTME: Create notifications system for user activity
-- ABOUTME: Supports likes, retweets, follows, replies, and mentions

-- =============================================
-- CREATE NOTIFICATIONS TABLE
-- =============================================

CREATE TYPE notification_type AS ENUM (
  'like',
  'retweet',
  'follow',
  'reply',
  'mention',
  'quote'
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT no_self_notification CHECK (recipient_id != sender_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for fetching user's notifications (most common query)
CREATE INDEX idx_notifications_recipient_created ON public.notifications(recipient_id, created_at DESC);

-- Index for filtering unread notifications
CREATE INDEX idx_notifications_recipient_unread ON public.notifications(recipient_id, read) WHERE read = FALSE;

-- Index for checking if notification already exists
CREATE INDEX idx_notifications_unique_lookup ON public.notifications(recipient_id, sender_id, type, post_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- System can create notifications (handled via triggers/functions)
CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (recipient_id = auth.uid());

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Notification Types:
--   like: Someone liked your post
--   retweet: Someone retweeted your post
--   follow: Someone followed you
--   reply: Someone replied to your post
--   mention: Someone mentioned you in a post
--   quote: Someone quote-tweeted your post

-- recipient_id: User receiving the notification
-- sender_id: User who triggered the notification
-- post_id: Associated post (null for follows)
-- read: Whether the notification has been read
