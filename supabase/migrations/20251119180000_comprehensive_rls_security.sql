-- ABOUTME: Comprehensive RLS security for all tables
-- ABOUTME: Ensures every table has RLS enabled with appropriate policies

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

-- Core tables (already enabled in initial schema, but ensuring)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Additional tables
ALTER TABLE public.retweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- Community tables
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_event_attendees ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR NEW TABLES
-- =============================================

-- RETWEETS
DROP POLICY IF EXISTS "Users can view all retweets" ON public.retweets;
DROP POLICY IF EXISTS "Users can create their own retweets" ON public.retweets;
DROP POLICY IF EXISTS "Users can delete their own retweets" ON public.retweets;

CREATE POLICY "Users can view all retweets"
ON public.retweets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own retweets"
ON public.retweets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own retweets"
ON public.retweets FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;

CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conversations.id
    AND user_id = auth.uid()
  )
);

-- CONVERSATION PARTICIPANTS
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- HASHTAGS (public, read-only)
DROP POLICY IF EXISTS "Anyone can view hashtags" ON public.hashtags;

CREATE POLICY "Anyone can view hashtags"
ON public.hashtags FOR SELECT
TO authenticated
USING (true);

-- POST_HASHTAGS (public, read-only)
DROP POLICY IF EXISTS "Users can view post hashtags" ON public.post_hashtags;

CREATE POLICY "Users can view post hashtags"
ON public.post_hashtags FOR SELECT
TO authenticated
USING (true);

-- MENTIONS
DROP POLICY IF EXISTS "Users can view mentions" ON public.mentions;
DROP POLICY IF EXISTS "Users can view their own mentions" ON public.mentions;

CREATE POLICY "Users can view their own mentions"
ON public.mentions FOR SELECT
TO authenticated
USING (mentioned_user_id = auth.uid());

-- BOOKMARKS
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;

CREATE POLICY "Users can view their own bookmarks"
ON public.bookmarks FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bookmarks"
ON public.bookmarks FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own bookmarks"
ON public.bookmarks FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- LISTS
DROP POLICY IF EXISTS "Users can view public lists and their own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can create their own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON public.lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON public.lists;

CREATE POLICY "Users can view public lists and their own lists"
ON public.lists FOR SELECT
TO authenticated
USING (is_private = false OR owner_id = auth.uid());

CREATE POLICY "Users can create their own lists"
ON public.lists FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own lists"
ON public.lists FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own lists"
ON public.lists FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- LIST_MEMBERS (managed by list owner)
DROP POLICY IF EXISTS "Users can view list members" ON public.list_members;
DROP POLICY IF EXISTS "List owners can manage members" ON public.list_members;

CREATE POLICY "Users can view list members"
ON public.list_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = list_members.list_id
    AND (is_private = false OR owner_id = auth.uid())
  )
);

CREATE POLICY "List owners can manage members"
ON public.list_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = list_members.list_id
    AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = list_members.list_id
    AND owner_id = auth.uid()
  )
);

-- POST_THREADS
DROP POLICY IF EXISTS "Users can view all post threads" ON public.post_threads;

CREATE POLICY "Users can view all post threads"
ON public.post_threads FOR SELECT
TO authenticated
USING (true);

-- POLLS
DROP POLICY IF EXISTS "Users can view all polls" ON public.polls;
DROP POLICY IF EXISTS "Users can create polls for their own posts" ON public.polls;

CREATE POLICY "Users can view all polls"
ON public.polls FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create polls for their own posts"
ON public.polls FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = polls.post_id
    AND user_id = auth.uid()
  )
);

-- POLL_OPTIONS
DROP POLICY IF EXISTS "Users can view poll options" ON public.poll_options;

CREATE POLICY "Users can view poll options"
ON public.poll_options FOR SELECT
TO authenticated
USING (true);

-- POLL_VOTES
DROP POLICY IF EXISTS "Users can view poll votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can create their own votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.poll_votes;

CREATE POLICY "Users can view poll votes"
ON public.poll_votes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own votes"
ON public.poll_votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own votes"
ON public.poll_votes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- POST_VIEWS
DROP POLICY IF EXISTS "Users can view all post views" ON public.post_views;
DROP POLICY IF EXISTS "Users can create post views" ON public.post_views;

CREATE POLICY "Users can view all post views"
ON public.post_views FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create post views"
ON public.post_views FOR INSERT
TO authenticated
WITH CHECK (true); -- Anonymous viewing allowed

-- SCHEDULED_POSTS
DROP POLICY IF EXISTS "Users can view their own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can create their own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can update their own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can delete their own scheduled posts" ON public.scheduled_posts;

CREATE POLICY "Users can view their own scheduled posts"
ON public.scheduled_posts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own scheduled posts"
ON public.scheduled_posts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own scheduled posts"
ON public.scheduled_posts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own scheduled posts"
ON public.scheduled_posts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- MUTED_USERS
DROP POLICY IF EXISTS "Users can view their own muted users" ON public.muted_users;
DROP POLICY IF EXISTS "Users can mute other users" ON public.muted_users;
DROP POLICY IF EXISTS "Users can unmute users" ON public.muted_users;

CREATE POLICY "Users can view their own muted users"
ON public.muted_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can mute other users"
ON public.muted_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unmute users"
ON public.muted_users FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- BLOCKED_USERS
DROP POLICY IF EXISTS "Users can view their own blocked users" ON public.blocked_users;
DROP POLICY IF EXISTS "Users can block other users" ON public.blocked_users;
DROP POLICY IF EXISTS "Users can unblock users" ON public.blocked_users;

CREATE POLICY "Users can view their own blocked users"
ON public.blocked_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can block other users"
ON public.blocked_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND user_id != blocked_user_id);

CREATE POLICY "Users can unblock users"
ON public.blocked_users FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- REPORTS
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
TO authenticated
USING (reported_by = auth.uid());

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (reported_by = auth.uid());

-- POST_IMAGES
DROP POLICY IF EXISTS "Users can view all post images" ON public.post_images;
DROP POLICY IF EXISTS "Users can create images for their own posts" ON public.post_images;
DROP POLICY IF EXISTS "Users can delete images from their own posts" ON public.post_images;

CREATE POLICY "Users can view all post images"
ON public.post_images FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create images for their own posts"
ON public.post_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = post_images.post_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete images from their own posts"
ON public.post_images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = post_images.post_id
    AND user_id = auth.uid()
  )
);

-- =============================================
-- COMMUNITIES RLS POLICIES
-- =============================================

-- COMMUNITIES
DROP POLICY IF EXISTS "Users can view all communities" ON public.communities;
DROP POLICY IF EXISTS "Users can create communities" ON public.communities;
DROP POLICY IF EXISTS "Community owners and mods can update" ON public.communities;

CREATE POLICY "Users can view all communities"
ON public.communities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create communities"
ON public.communities FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Community owners and mods can update"
ON public.communities FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = communities.id
    AND user_id = auth.uid()
    AND role IN ('admin', 'moderator')
    AND status = 'active'
  )
)
WITH CHECK (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = communities.id
    AND user_id = auth.uid()
    AND role IN ('admin', 'moderator')
    AND status = 'active'
  )
);

-- COMMUNITY_MEMBERS
DROP POLICY IF EXISTS "Users can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;

CREATE POLICY "Users can view community members"
ON public.community_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join communities"
ON public.community_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave communities"
ON public.community_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- COMMUNITY_POSTS
DROP POLICY IF EXISTS "Users can view community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Community members can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Post authors can delete their posts" ON public.community_posts;

CREATE POLICY "Users can view community posts"
ON public.community_posts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Community members can create posts"
ON public.community_posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = community_posts.community_id
    AND user_id = auth.uid()
    AND status = 'active'
  )
);

CREATE POLICY "Post authors can delete their posts"
ON public.community_posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = community_posts.post_id
    AND user_id = auth.uid()
  )
);

-- COMMUNITY_EVENTS
DROP POLICY IF EXISTS "Users can view community events" ON public.community_events;
DROP POLICY IF EXISTS "Community mods can create events" ON public.community_events;

CREATE POLICY "Users can view community events"
ON public.community_events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Community mods can create events"
ON public.community_events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.communities
    WHERE id = community_events.community_id
    AND owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = community_events.community_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'moderator')
    AND status = 'active'
  )
);

-- COMMUNITY_EVENT_ATTENDEES
DROP POLICY IF EXISTS "Users can view event attendees" ON public.community_event_attendees;
DROP POLICY IF EXISTS "Users can RSVP to events" ON public.community_event_attendees;
DROP POLICY IF EXISTS "Users can cancel their RSVP" ON public.community_event_attendees;

CREATE POLICY "Users can view event attendees"
ON public.community_event_attendees FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can RSVP to events"
ON public.community_event_attendees FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel their RSVP"
ON public.community_event_attendees FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- SUMMARY
-- =============================================

-- All tables now have RLS enabled
-- Policies follow principle of least privilege
-- Users can only access their own data or public data
-- Community roles (owner, admin, moderator) have appropriate permissions
