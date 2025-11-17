-- ABOUTME: Add content reporting system for posts and users
-- ABOUTME: Allows users to report inappropriate content with categories

-- =============================================
-- CREATE REPORTS TABLE
-- =============================================

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'violence', 'misinformation', 'nsfw', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_note TEXT,

  -- Either reported_post_id or reported_user_id must be set, but not both
  CONSTRAINT report_target CHECK (
    (reported_post_id IS NOT NULL AND reported_user_id IS NULL) OR
    (reported_post_id IS NULL AND reported_user_id IS NOT NULL)
  ),

  -- Users cannot report the same content multiple times
  CONSTRAINT unique_post_report UNIQUE (reporter_id, reported_post_id),
  CONSTRAINT unique_user_report UNIQUE (reporter_id, reported_user_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for finding reports by status
CREATE INDEX idx_reports_status ON public.reports(status);

-- Index for finding reports by reporter
CREATE INDEX idx_reports_reporter ON public.reports(reporter_id);

-- Index for finding reports about a post
CREATE INDEX idx_reports_post ON public.reports(reported_post_id) WHERE reported_post_id IS NOT NULL;

-- Index for finding reports about a user
CREATE INDEX idx_reports_user ON public.reports(reported_user_id) WHERE reported_user_id IS NOT NULL;

-- Index for finding pending reports (for moderation)
CREATE INDEX idx_reports_pending ON public.reports(created_at DESC) WHERE status = 'pending';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

-- Users can create reports
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

-- Only moderators/admins can update reports (for now, no one can)
-- This will be implemented when we add role-based access control

-- =============================================
-- FUNCTION TO UPDATE updated_at TIMESTAMP
-- =============================================

CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at_trigger
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION update_reports_updated_at();

-- =============================================
-- HELPER COMMENTS
-- =============================================

-- Report reasons:
--   spam: Unsolicited or repetitive content
--   harassment: Bullying, threats, or targeted abuse
--   hate_speech: Content promoting hate based on identity
--   violence: Graphic violence or threats
--   misinformation: False or misleading information
--   nsfw: Adult content or nudity
--   other: Other violations (requires description)

-- Report statuses:
--   pending: Newly submitted, awaiting review
--   reviewing: Under active investigation
--   resolved: Action taken (content removed, user warned, etc.)
--   dismissed: No action needed

-- Usage:
--   Report a post: INSERT INTO reports (reporter_id, reported_post_id, reason, description)
--   Report a user: INSERT INTO reports (reporter_id, reported_user_id, reason, description)
