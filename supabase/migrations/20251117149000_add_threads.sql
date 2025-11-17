-- ABOUTME: Add thread support for multi-post threads
-- ABOUTME: Groups connected posts together with thread_id

-- =============================================
-- ADD THREAD_ID COLUMN TO POSTS
-- =============================================

ALTER TABLE public.posts
ADD COLUMN thread_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;

-- =============================================
-- INDEXES
-- =============================================

-- Index for finding all posts in a thread
CREATE INDEX idx_posts_thread ON public.posts(thread_id, created_at ASC) WHERE thread_id IS NOT NULL;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to automatically set thread_id for replies
CREATE OR REPLACE FUNCTION set_thread_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a reply, inherit the thread_id from parent
  IF NEW.reply_to_id IS NOT NULL THEN
    SELECT COALESCE(thread_id, id) INTO NEW.thread_id
    FROM public.posts
    WHERE id = NEW.reply_to_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to automatically set thread_id on insert
CREATE TRIGGER set_thread_id_on_insert
BEFORE INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION set_thread_id();

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Threads work as follows:
-- 1. First post in thread has thread_id = NULL (or can be set to its own id)
-- 2. Replies inherit the thread_id from their parent
-- 3. All posts in a thread share the same thread_id
-- 4. To get a full thread, query WHERE thread_id = X OR id = X
