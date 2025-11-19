-- ABOUTME: Audio spaces (Twitter Spaces clone) schema - FREE WebRTC P2P
-- ABOUTME: Spaces, participants, signaling for peer-to-peer audio

-- =============================================
-- AUDIO SPACES TABLES
-- =============================================

-- Audio spaces (rooms for live audio conversations)
CREATE TABLE IF NOT EXISTS public.audio_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,

  -- Space settings
  is_public BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 50,
  allow_requests BOOLEAN DEFAULT true,

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,

  -- Stats
  participant_count INTEGER DEFAULT 0,
  peak_participants INTEGER DEFAULT 0,
  total_joined INTEGER DEFAULT 0,

  -- Metadata
  recording_enabled BOOLEAN DEFAULT false,
  recording_url TEXT,
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Space participants (users in audio spaces)
CREATE TABLE IF NOT EXISTS public.space_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.audio_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Participant status
  role VARCHAR(20) DEFAULT 'listener' CHECK (role IN ('host', 'speaker', 'listener')),
  is_muted BOOLEAN DEFAULT false,
  is_hand_raised BOOLEAN DEFAULT false,

  -- Connection info
  peer_id TEXT, -- Simple-peer connection ID
  is_connected BOOLEAN DEFAULT false,

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  last_seen TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(space_id, user_id)
);

-- Signaling messages (WebRTC signaling via database)
CREATE TABLE IF NOT EXISTS public.signaling_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.audio_spaces(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for broadcast

  -- Signaling data
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('offer', 'answer', 'ice-candidate', 'peer-joined', 'peer-left')),
  payload JSONB NOT NULL,

  -- Status
  delivered BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes' -- Auto-cleanup old signals
);

-- Space invites
CREATE TABLE IF NOT EXISTS public.space_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.audio_spaces(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  UNIQUE(space_id, invitee_id)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_audio_spaces_host ON public.audio_spaces(host_id);
CREATE INDEX idx_audio_spaces_status ON public.audio_spaces(status);
CREATE INDEX idx_audio_spaces_scheduled ON public.audio_spaces(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_audio_spaces_live ON public.audio_spaces(started_at) WHERE status = 'live';

CREATE INDEX idx_space_participants_space ON public.space_participants(space_id);
CREATE INDEX idx_space_participants_user ON public.space_participants(user_id);
CREATE INDEX idx_space_participants_connected ON public.space_participants(space_id, is_connected);

CREATE INDEX idx_signaling_messages_space ON public.signaling_messages(space_id);
CREATE INDEX idx_signaling_messages_to_user ON public.signaling_messages(to_user_id) WHERE to_user_id IS NOT NULL;
CREATE INDEX idx_signaling_messages_delivered ON public.signaling_messages(delivered) WHERE NOT delivered;
CREATE INDEX idx_signaling_messages_expires ON public.signaling_messages(expires_at);

CREATE INDEX idx_space_invites_invitee ON public.space_invites(invitee_id);
CREATE INDEX idx_space_invites_status ON public.space_invites(status);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.audio_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signaling_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_invites ENABLE ROW LEVEL SECURITY;

-- Audio spaces policies
CREATE POLICY "Users can view public spaces"
ON public.audio_spaces FOR SELECT
TO authenticated
USING (is_public = true OR host_id = auth.uid());

CREATE POLICY "Users can create spaces"
ON public.audio_spaces FOR INSERT
TO authenticated
WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update their spaces"
ON public.audio_spaces FOR UPDATE
TO authenticated
USING (host_id = auth.uid());

CREATE POLICY "Hosts can delete their spaces"
ON public.audio_spaces FOR DELETE
TO authenticated
USING (host_id = auth.uid());

-- Participants policies
CREATE POLICY "Users can view participants in their spaces"
ON public.space_participants FOR SELECT
TO authenticated
USING (
  space_id IN (
    SELECT id FROM public.audio_spaces
    WHERE is_public = true OR host_id = auth.uid()
  )
);

CREATE POLICY "Users can join spaces"
ON public.space_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participation"
ON public.space_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can leave spaces"
ON public.space_participants FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Signaling policies
CREATE POLICY "Users can send signals in their spaces"
ON public.signaling_messages FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id = auth.uid() AND
  space_id IN (
    SELECT space_id FROM public.space_participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view signals in their spaces"
ON public.signaling_messages FOR SELECT
TO authenticated
USING (
  to_user_id = auth.uid() OR
  to_user_id IS NULL AND space_id IN (
    SELECT space_id FROM public.space_participants
    WHERE user_id = auth.uid()
  )
);

-- Invites policies
CREATE POLICY "Users can view their invites"
ON public.space_invites FOR SELECT
TO authenticated
USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

CREATE POLICY "Users can send invites"
ON public.space_invites FOR INSERT
TO authenticated
WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can respond to invites"
ON public.space_invites FOR UPDATE
TO authenticated
USING (invitee_id = auth.uid());

-- =============================================
-- FUNCTIONS
-- =============================================

-- Update participant count when users join/leave
CREATE OR REPLACE FUNCTION update_space_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.audio_spaces
    SET
      participant_count = participant_count + 1,
      total_joined = total_joined + 1,
      peak_participants = GREATEST(peak_participants, participant_count + 1)
    WHERE id = NEW.space_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.audio_spaces
    SET participant_count = participant_count - 1
    WHERE id = OLD.space_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_participant_count
AFTER INSERT OR DELETE ON public.space_participants
FOR EACH ROW
EXECUTE FUNCTION update_space_participant_count();

-- Cleanup old signaling messages
CREATE OR REPLACE FUNCTION cleanup_old_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM public.signaling_messages
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_audio_spaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audio_spaces_updated_at
BEFORE UPDATE ON public.audio_spaces
FOR EACH ROW
EXECUTE FUNCTION update_audio_spaces_updated_at();

-- Get active spaces with participant info
CREATE OR REPLACE FUNCTION get_active_spaces(limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
  space_id UUID,
  title VARCHAR,
  description TEXT,
  host_id UUID,
  host_username VARCHAR,
  host_display_name VARCHAR,
  status VARCHAR,
  started_at TIMESTAMPTZ,
  participant_count INTEGER,
  peak_participants INTEGER,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    s.host_id,
    p.username,
    p.display_name,
    s.status,
    s.started_at,
    s.participant_count,
    s.peak_participants,
    s.tags
  FROM public.audio_spaces s
  JOIN public.profiles p ON p.id = s.host_id
  WHERE s.status IN ('live', 'scheduled')
  ORDER BY
    CASE WHEN s.status = 'live' THEN 0 ELSE 1 END,
    s.started_at DESC,
    s.scheduled_for ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.audio_spaces IS 'Live audio spaces (Twitter Spaces clone) - FREE WebRTC P2P';
COMMENT ON TABLE public.space_participants IS 'Participants in audio spaces with roles';
COMMENT ON TABLE public.signaling_messages IS 'WebRTC signaling via database (P2P connection setup)';
COMMENT ON FUNCTION get_active_spaces IS 'Get live and scheduled spaces with host info';
