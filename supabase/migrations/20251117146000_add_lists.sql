-- ABOUTME: Create lists system for organizing users
-- ABOUTME: Users can create lists and add other users to them

-- =============================================
-- CREATE LISTS TABLE
-- =============================================

CREATE TABLE public.lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT list_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT list_name_max_length CHECK (LENGTH(name) <= 100),
  CONSTRAINT list_description_max_length CHECK (description IS NULL OR LENGTH(description) <= 500)
);

-- =============================================
-- CREATE LIST MEMBERS TABLE
-- =============================================

CREATE TABLE public.list_members (
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (list_id, user_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for finding user's lists
CREATE INDEX idx_lists_owner ON public.lists(owner_id, created_at DESC);

-- Index for finding members of a list
CREATE INDEX idx_list_members_list ON public.list_members(list_id, added_at DESC);

-- Index for finding which lists a user is in
CREATE INDEX idx_list_members_user ON public.list_members(user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update list's updated_at timestamp
CREATE OR REPLACE FUNCTION update_list_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.lists
  SET updated_at = NOW()
  WHERE id = NEW.list_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update list timestamp when member is added/removed
CREATE TRIGGER update_list_on_member_change
AFTER INSERT OR DELETE ON public.list_members
FOR EACH ROW
EXECUTE FUNCTION update_list_timestamp();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own lists
CREATE POLICY "Users can view their own lists"
ON public.lists FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Users can view public lists
CREATE POLICY "Users can view public lists"
ON public.lists FOR SELECT
TO authenticated
USING (is_private = FALSE);

-- Users can create their own lists
CREATE POLICY "Users can create their own lists"
ON public.lists FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Users can update their own lists
CREATE POLICY "Users can update their own lists"
ON public.lists FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Users can delete their own lists
CREATE POLICY "Users can delete their own lists"
ON public.lists FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Users can view members of their own lists
CREATE POLICY "Users can view members of their own lists"
ON public.list_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = list_members.list_id
    AND owner_id = auth.uid()
  )
);

-- Users can view members of public lists
CREATE POLICY "Users can view members of public lists"
ON public.list_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = list_members.list_id
    AND is_private = FALSE
  )
);

-- Users can add members to their own lists
CREATE POLICY "Users can add members to their own lists"
ON public.list_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = list_members.list_id
    AND owner_id = auth.uid()
  )
);

-- Users can remove members from their own lists
CREATE POLICY "Users can remove members from their own lists"
ON public.list_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = list_members.list_id
    AND owner_id = auth.uid()
  )
);

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Lists: User-created collections of other users
-- List Members: Many-to-many relationship between lists and users
-- Private lists are only visible to the owner
-- Public lists are visible to everyone
-- List timeline shows posts from all members of the list
