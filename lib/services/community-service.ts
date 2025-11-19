// ABOUTME: Community service - business logic for communities
// ABOUTME: Validation, permissions, analytics

// @ts-nocheck
import { communityRepository } from '@/lib/repositories/community-repository'
import type {
  Community,
  CommunityMember,
  CommunityFilters,
  CreateCommunityInput,
  UpdateCommunityInput,
  CommunityStats,
  MemberRole,
} from '@/lib/types/community'

export const communityService = {
  // ============== Communities ==============

  async getCommunities(filters: CommunityFilters = {}) {
    return communityRepository.getAll(filters)
  },

  async getCommunity(id: string) {
    return communityRepository.getById(id)
  },

  async getCommunityBySlug(slug: string) {
    return communityRepository.getBySlug(slug)
  },

  async createCommunity(userId: string, input: CreateCommunityInput) {
    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(input.slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens')
    }

    // Validate slug length
    if (input.slug.length < 3 || input.slug.length > 50) {
      throw new Error('Slug must be between 3 and 50 characters')
    }

    // Validate name length
    if (input.name.length < 3 || input.name.length > 100) {
      throw new Error('Name must be between 3 and 100 characters')
    }

    // Validate description length
    if (input.description.length < 10 || input.description.length > 500) {
      throw new Error('Description must be between 10 and 500 characters')
    }

    return communityRepository.create(userId, input)
  },

  async updateCommunity(communityId: string, userId: string, input: UpdateCommunityInput) {
    // Check permissions
    const memberRole = await communityRepository.getMemberRole(communityId, userId)
    if (!memberRole || !['owner', 'admin'].includes(memberRole.role)) {
      throw new Error('Only owners and admins can update community settings')
    }

    // Validate if provided
    if (input.name && (input.name.length < 3 || input.name.length > 100)) {
      throw new Error('Name must be between 3 and 100 characters')
    }

    if (input.description && (input.description.length < 10 || input.description.length > 500)) {
      throw new Error('Description must be between 10 and 500 characters')
    }

    return communityRepository.update(communityId, input)
  },

  async deleteCommunity(communityId: string, userId: string) {
    // Only owner can delete
    const memberRole = await communityRepository.getMemberRole(communityId, userId)
    if (!memberRole || memberRole.role !== 'owner') {
      throw new Error('Only the owner can delete the community')
    }

    return communityRepository.delete(communityId)
  },

  async getUserCommunities(userId: string) {
    return communityRepository.getUserCommunities(userId)
  },

  // ============== Membership ==============

  async getMembers(communityId: string) {
    return communityRepository.getMembers(communityId)
  },

  async getMemberRole(communityId: string, userId: string) {
    return communityRepository.getMemberRole(communityId, userId)
  },

  async joinCommunity(communityId: string, userId: string) {
    // Check if already a member
    const existingMember = await communityRepository.getMemberRole(communityId, userId)
    if (existingMember) {
      if (existingMember.status === 'banned') {
        throw new Error('You are banned from this community')
      }
      if (existingMember.status === 'active') {
        throw new Error('You are already a member of this community')
      }
      if (existingMember.status === 'pending') {
        throw new Error('Your membership request is pending approval')
      }
    }

    // Check community type
    const community = await communityRepository.getById(communityId)
    if (community.type === 'secret') {
      throw new Error('This is a secret community. You need an invite to join.')
    }

    return communityRepository.joinCommunity(communityId, userId)
  },

  async leaveCommunity(communityId: string, userId: string) {
    // Check if owner
    const memberRole = await communityRepository.getMemberRole(communityId, userId)
    if (memberRole?.role === 'owner') {
      throw new Error('Owners cannot leave their community. Transfer ownership or delete the community.')
    }

    return communityRepository.leaveCommunity(communityId, userId)
  },

  async updateMemberRole(
    communityId: string,
    targetUserId: string,
    newRole: 'admin' | 'moderator' | 'member',
    requestingUserId: string
  ) {
    // Check permissions
    const requesterRole = await communityRepository.getMemberRole(communityId, requestingUserId)
    if (!requesterRole || !['owner', 'admin'].includes(requesterRole.role)) {
      throw new Error('Only owners and admins can change member roles')
    }

    // Can't change owner role
    const targetRole = await communityRepository.getMemberRole(communityId, targetUserId)
    if (targetRole?.role === 'owner') {
      throw new Error('Cannot change owner role')
    }

    // Admins can't promote to admin (only owner can)
    if (newRole === 'admin' && requesterRole.role === 'admin') {
      throw new Error('Only owners can promote members to admin')
    }

    return communityRepository.updateMemberRole(communityId, targetUserId, newRole)
  },

  async removeMember(communityId: string, targetUserId: string, requestingUserId: string) {
    // Check permissions
    const requesterRole = await communityRepository.getMemberRole(communityId, requestingUserId)
    if (!requesterRole || !['owner', 'admin', 'moderator'].includes(requesterRole.role)) {
      throw new Error('Only owners, admins, and moderators can remove members')
    }

    // Can't remove owner
    const targetRole = await communityRepository.getMemberRole(communityId, targetUserId)
    if (targetRole?.role === 'owner') {
      throw new Error('Cannot remove the owner')
    }

    // Moderators can only remove regular members
    if (requesterRole.role === 'moderator' && targetRole?.role !== 'member') {
      throw new Error('Moderators can only remove regular members')
    }

    return communityRepository.removeMember(communityId, targetUserId)
  },

  async banMember(communityId: string, targetUserId: string, requestingUserId: string) {
    // Check permissions
    const requesterRole = await communityRepository.getMemberRole(communityId, requestingUserId)
    if (!requesterRole || !['owner', 'admin', 'moderator'].includes(requesterRole.role)) {
      throw new Error('Only owners, admins, and moderators can ban members')
    }

    // Can't ban owner
    const targetRole = await communityRepository.getMemberRole(communityId, targetUserId)
    if (targetRole?.role === 'owner') {
      throw new Error('Cannot ban the owner')
    }

    // Moderators can only ban regular members
    if (requesterRole.role === 'moderator' && targetRole?.role !== 'member') {
      throw new Error('Moderators can only ban regular members')
    }

    return communityRepository.banMember(communityId, targetUserId)
  },

  // ============== Posts ==============

  async getPosts(communityId: string, userId?: string, limit = 20, offset = 0) {
    // Check if user can view posts
    if (userId) {
      const community = await communityRepository.getById(communityId)
      if (community.type !== 'public') {
        const memberRole = await communityRepository.getMemberRole(communityId, userId)
        if (!memberRole || memberRole.status !== 'active') {
          throw new Error('You must be a member to view posts in this community')
        }
      }
    }

    return communityRepository.getPosts(communityId, limit, offset)
  },

  async createPost(communityId: string, userId: string, content: string) {
    // Check membership
    const memberRole = await communityRepository.getMemberRole(communityId, userId)
    if (!memberRole || memberRole.status !== 'active') {
      throw new Error('You must be a member to post in this community')
    }

    // Check if banned
    if (memberRole.status === 'banned') {
      throw new Error('You are banned from this community')
    }

    // Check community settings
    const community = await communityRepository.getById(communityId)
    if (!community.allowMemberPosts && memberRole.role === 'member') {
      throw new Error('Only moderators and admins can post in this community')
    }

    // Validate content
    if (content.length < 1 || content.length > 5000) {
      throw new Error('Post content must be between 1 and 5000 characters')
    }

    return communityRepository.createPost(communityId, userId, content)
  },

  async deletePost(postId: string, userId: string, communityId: string) {
    // Check if user is author or moderator
    const memberRole = await communityRepository.getMemberRole(communityId, userId)
    if (!memberRole) {
      throw new Error('You are not a member of this community')
    }

    // Allow deletion if: author, moderator, admin, or owner
    // This will need post author check in real implementation
    if (!['owner', 'admin', 'moderator'].includes(memberRole.role)) {
      // In real implementation, check if userId is the post author
      throw new Error('You can only delete your own posts or be a moderator')
    }

    return communityRepository.deletePost(postId)
  },

  // ============== Events ==============

  async getEvents(communityId: string) {
    return communityRepository.getEvents(communityId)
  },

  async createEvent(
    communityId: string,
    userId: string,
    input: {
      title: string
      description: string
      startTime: string
      endTime?: string
      location?: string
      isOnline: boolean
      maxAttendees?: number
    }
  ) {
    // Check permissions
    const memberRole = await communityRepository.getMemberRole(communityId, userId)
    if (!memberRole || !['owner', 'admin', 'moderator'].includes(memberRole.role)) {
      throw new Error('Only owners, admins, and moderators can create events')
    }

    // Validate
    if (input.title.length < 3 || input.title.length > 200) {
      throw new Error('Event title must be between 3 and 200 characters')
    }

    if (input.description.length < 10 || input.description.length > 2000) {
      throw new Error('Event description must be between 10 and 2000 characters')
    }

    const startTime = new Date(input.startTime)
    if (startTime < new Date()) {
      throw new Error('Event start time must be in the future')
    }

    return communityRepository.createEvent(communityId, userId, input)
  },

  async attendEvent(eventId: string, userId: string, status: 'going' | 'maybe' | 'not_going') {
    return communityRepository.attendEvent(eventId, userId, status)
  },

  // ============== Analytics ==============

  async getCommunityStats(communityId: string): Promise<CommunityStats> {
    const community = await communityRepository.getById(communityId)

    // In a real implementation, these would be calculated from actual data
    // For now, returning mock stats based on current counts
    return {
      totalMembers: community.member_count,
      activeMembersToday: Math.floor(community.member_count * 0.2), // Mock: 20% active
      totalPosts: community.post_count,
      postsToday: Math.floor(Math.random() * 10), // Mock
      totalEvents: 0, // Would query events table
      upcomingEvents: 0, // Would query events table
      growthRate: Math.random() * 20 - 5, // Mock: -5% to +15%
    }
  },

  // ============== Helpers ==============

  canManageCommunity(role?: MemberRole): boolean {
    return role ? ['owner', 'admin'].includes(role) : false
  },

  canModerate(role?: MemberRole): boolean {
    return role ? ['owner', 'admin', 'moderator'].includes(role) : false
  },

  canPost(role?: MemberRole, allowMemberPosts: boolean = true): boolean {
    if (!role) return false
    if (['owner', 'admin', 'moderator'].includes(role)) return true
    return allowMemberPosts && role === 'member'
  },
}
