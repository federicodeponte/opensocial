// ABOUTME: Profile service implementing business logic for profile operations
// ABOUTME: Acts as intermediary between API routes and repository layer

import { DbClient, profileRepository } from '@/lib/repositories/profile-repository'
import { followRepository } from '@/lib/repositories/follow-repository'
import { ValidationError, NotFoundError } from '@/lib/errors/app-error'
import { logger } from '@/lib/utils/logger'
import { Database } from '@/lib/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface UpdateProfileInput {
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  header_url?: string | null
  location?: string | null
  website?: string | null
}

export interface ProfileWithFollowStatus extends ProfileRow {
  isFollowing?: boolean
  isOwnProfile?: boolean
  isMuted?: boolean
  isBlocked?: boolean
}

export class ProfileService {
  /**
   * Get profile by username
   */
  async getProfileByUsername(
    client: DbClient,
    username: string,
    currentUserId?: string
  ): Promise<ProfileWithFollowStatus | null> {
    logger.debug('Fetching profile by username', { username })

    const profile = await profileRepository.getProfileByUsername(client, username)

    if (!profile) {
      logger.debug('Profile not found', { username })
      return null
    }

    // Add follow status if current user is provided
    let isFollowing = false
    let isMuted = false
    let isBlocked = false

    if (currentUserId && currentUserId !== profile.id) {
      isFollowing = await followRepository.isFollowing(client, currentUserId, profile.id)

      // Check if current user has muted this profile
      const { data: muteData } = await client
        .from('muted_users')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('muted_user_id', profile.id)
        .maybeSingle()
      isMuted = !!muteData

      // Check if current user has blocked this profile
      const { data: blockData } = await client
        .from('blocked_users')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('blocked_user_id', profile.id)
        .maybeSingle()
      isBlocked = !!blockData
    }

    return {
      ...profile,
      isFollowing,
      isOwnProfile: currentUserId === profile.id,
      isMuted,
      isBlocked,
    }
  }

  /**
   * Get profile by ID
   */
  async getProfileById(
    client: DbClient,
    userId: string,
    currentUserId?: string
  ): Promise<ProfileWithFollowStatus | null> {
    logger.debug('Fetching profile by ID', { userId })

    const profile = await profileRepository.getProfileById(client, userId)

    if (!profile) {
      logger.debug('Profile not found', { userId })
      return null
    }

    // Add follow status if current user is provided
    let isFollowing = false
    let isMuted = false
    let isBlocked = false

    if (currentUserId && currentUserId !== profile.id) {
      isFollowing = await followRepository.isFollowing(client, currentUserId, profile.id)

      // Check if current user has muted this profile
      const { data: muteData } = await client
        .from('muted_users')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('muted_user_id', profile.id)
        .maybeSingle()
      isMuted = !!muteData

      // Check if current user has blocked this profile
      const { data: blockData } = await client
        .from('blocked_users')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('blocked_user_id', profile.id)
        .maybeSingle()
      isBlocked = !!blockData
    }

    return {
      ...profile,
      isFollowing,
      isOwnProfile: currentUserId === profile.id,
      isMuted,
      isBlocked,
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    client: DbClient,
    userId: string,
    input: UpdateProfileInput
  ): Promise<ProfileRow> {
    // Business logic validation
    if (input.bio && input.bio.length > 160) {
      throw new ValidationError('Bio must be 160 characters or less')
    }

    if (input.website && !this.isValidUrl(input.website)) {
      throw new ValidationError('Invalid website URL')
    }

    // Verify profile exists
    const existingProfile = await profileRepository.getProfileById(client, userId)
    if (!existingProfile) {
      throw new NotFoundError('Profile not found')
    }

    logger.info('Updating profile', { userId, fields: Object.keys(input) })

    const profile = await profileRepository.updateProfile(client, userId, input)

    logger.info('Profile updated successfully', { userId })

    return profile
  }

  /**
   * Search profiles using full-text search
   */
  async searchProfiles(
    client: DbClient,
    query: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<ProfileRow[]> {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      throw new ValidationError('Search query cannot be empty')
    }

    if (trimmedQuery.length < 2) {
      throw new ValidationError('Search query must be at least 2 characters')
    }

    const limit = Math.min(options?.limit ?? 20, 50) // Max 50 results
    const offset = options?.offset ?? 0

    logger.debug('Searching profiles', { query: trimmedQuery, limit, offset })

    const profiles = await profileRepository.searchProfiles(client, trimmedQuery, {
      limit,
      offset,
    })

    logger.debug('Profile search results', { count: profiles.length })

    return profiles
  }

  /**
   * Get suggested users to follow (popular users not followed by current user)
   */
  async getSuggestedProfiles(
    client: DbClient,
    currentUserId: string,
    options?: {
      limit?: number
    }
  ): Promise<ProfileRow[]> {
    const limit = Math.min(options?.limit ?? 10, 20) // Max 20 suggestions

    logger.debug('Fetching suggested profiles', { currentUserId, limit })

    const profiles = await profileRepository.getSuggestedProfiles(client, currentUserId, {
      limit,
    })

    logger.debug('Suggested profiles fetched', { count: profiles.length })

    return profiles
  }

  /**
   * Follow a user
   */
  async followUser(client: DbClient, followerId: string, followingId: string): Promise<void> {
    // Business logic validation
    if (followerId === followingId) {
      throw new ValidationError('You cannot follow yourself')
    }

    // Check if target user exists
    const targetProfile = await profileRepository.getProfileById(client, followingId)
    if (!targetProfile) {
      throw new NotFoundError('User not found')
    }

    // Check if already following
    const isAlreadyFollowing = await followRepository.isFollowing(
      client,
      followerId,
      followingId
    )
    if (isAlreadyFollowing) {
      throw new ValidationError('You are already following this user')
    }

    logger.info('Following user', { followerId, followingId })

    await followRepository.followUser(client, followerId, followingId)

    logger.info('Successfully followed user', { followerId, followingId })
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(client: DbClient, followerId: string, followingId: string): Promise<void> {
    // Business logic validation
    if (followerId === followingId) {
      throw new ValidationError('Invalid operation')
    }

    // Check if actually following
    const isFollowing = await followRepository.isFollowing(client, followerId, followingId)
    if (!isFollowing) {
      throw new ValidationError('You are not following this user')
    }

    logger.info('Unfollowing user', { followerId, followingId })

    await followRepository.unfollowUser(client, followerId, followingId)

    logger.info('Successfully unfollowed user', { followerId, followingId })
  }

  /**
   * Get followers of a user
   */
  async getFollowers(
    client: DbClient,
    userId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ) {
    const limit = Math.min(options?.limit ?? 20, 100)
    const offset = options?.offset ?? 0

    logger.debug('Fetching followers', { userId, limit, offset })

    const followers = await followRepository.getFollowers(client, userId, { limit, offset })

    logger.debug('Followers fetched', { userId, count: followers.length })

    return followers
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(
    client: DbClient,
    userId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ) {
    const limit = Math.min(options?.limit ?? 20, 100)
    const offset = options?.offset ?? 0

    logger.debug('Fetching following', { userId, limit, offset })

    const following = await followRepository.getFollowing(client, userId, { limit, offset })

    logger.debug('Following fetched', { userId, count: following.length })

    return following
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService()
