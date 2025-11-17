-- ABOUTME: Add mention notification triggers
-- ABOUTME: Automatically create notifications when users are mentioned

-- =============================================
-- FUNCTION TO CREATE MENTION NOTIFICATIONS
-- =============================================

CREATE OR REPLACE FUNCTION create_mention_notifications()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_username TEXT;
  mentioned_user_id UUID;
  mentions TEXT[];
BEGIN
  -- Extract mentions from content using regex
  mentions := ARRAY(
    SELECT LOWER(substring(match, 2))
    FROM regexp_matches(NEW.content, '@(\w+)', 'g') AS match
  );

  -- Create notification for each mentioned user
  FOREACH mentioned_username IN ARRAY mentions
  LOOP
    -- Get user ID for mentioned username
    SELECT id INTO mentioned_user_id
    FROM public.profiles
    WHERE username = mentioned_username;

    -- If user exists and is not the author, create notification
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.author_id THEN
      INSERT INTO public.notifications (
        recipient_id,
        sender_id,
        type,
        post_id,
        read
      )
      VALUES (
        mentioned_user_id,
        NEW.author_id,
        'mention',
        NEW.id,
        FALSE
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER
-- =============================================

-- Trigger to create mention notifications when post is created
CREATE TRIGGER create_mention_notifications_on_post
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION create_mention_notifications();

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- This migration adds automatic mention notification creation
-- When a post contains @username, the mentioned user receives a notification
-- Notifications are only created if the mentioned user exists and is not the author
