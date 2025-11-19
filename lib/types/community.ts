// ABOUTME: Community and group type definitions
// ABOUTME: Public, private, secret communities with roles and permissions

export type CommunityType = 'public' | 'private' | 'secret'
export type MemberRole = 'owner' | 'admin' | 'moderator' | 'member'
export type MembershipStatus = 'active' | 'pending' | 'banned'

export interface Community {
  id: string
  name: string
  slug: string
  description: string
  type: CommunityType
  coverImage?: string
  avatarUrl?: string
  createdById: string
  createdAt: string
  updatedAt: string

  // Stats
  memberCount: number
  postCount: number

  // Settings
  allowMemberPosts: boolean
  requireApproval: boolean

  // Relations
  createdBy?: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }

  // User-specific
  userRole?: MemberRole
  isMember?: boolean
  membershipStatus?: MembershipStatus
}

export interface CommunityMember {
  id: string
  communityId: string
  userId: string
  role: MemberRole
  status: MembershipStatus
  joinedAt: string

  // Relations
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }
  community?: Community
}

export interface CommunityPost {
  id: string
  communityId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt: string

  // Stats
  likeCount: number
  commentCount: number

  // Relations
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }
  community: {
    id: string
    name: string
    slug: string
  }
}

export interface CommunityEvent {
  id: string
  communityId: string
  createdById: string
  title: string
  description: string
  startTime: string
  endTime?: string
  location?: string
  isOnline: boolean
  maxAttendees?: number
  createdAt: string

  // Stats
  attendeeCount: number

  // Relations
  community: {
    id: string
    name: string
    slug: string
  }
  createdBy: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }

  // User-specific
  isAttending?: boolean
}

export interface CommunityRule {
  id: string
  communityId: string
  title: string
  description: string
  order: number
  createdAt: string
}

export interface CommunityInvite {
  id: string
  communityId: string
  invitedById: string
  invitedUserId?: string
  inviteCode: string
  expiresAt?: string
  maxUses?: number
  useCount: number
  createdAt: string

  // Relations
  community: Community
  invitedBy: {
    id: string
    username: string
    displayName: string
  }
}

export interface CreateCommunityInput {
  name: string
  slug: string
  description: string
  type: CommunityType
  coverImage?: string
  avatarUrl?: string
  allowMemberPosts?: boolean
  requireApproval?: boolean
}

export interface UpdateCommunityInput {
  name?: string
  description?: string
  type?: CommunityType
  coverImage?: string
  avatarUrl?: string
  allowMemberPosts?: boolean
  requireApproval?: boolean
}

export interface CommunityFilters {
  type?: CommunityType
  search?: string
  sort?: 'newest' | 'popular' | 'members'
  limit?: number
  offset?: number
}

export interface CommunityStats {
  totalMembers: number
  activeMembersToday: number
  totalPosts: number
  postsToday: number
  totalEvents: number
  upcomingEvents: number
  growthRate: number // percentage change in members
}
