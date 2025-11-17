// ABOUTME: Follow repository handling follow/unfollow operations
// ABOUTME: Manages the followers/following relationships between users

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
import { handleSupabaseError } from '@/lib/errors/error-handler'

export type DbClient = SupabaseClient<Database>

type FollowRow = Database['public']['Tables']['follows']['Row']
type FollowInsert = Database['public']['Tables']['follows']['Insert']

export interface FollowWithProfile extends FollowRow {
  follower_profile?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  following_profile?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export class FollowRepository {
  private readonly tableName = 'follows' as const

  /**
   * Follow a user
   */
  async followUser(client: DbClient, followerId: string, followingId: string): Promise<FollowRow> {
    const followData: FollowInsert = {
      follower_id: followerId,
      following_id: followingId,
    }

    const { data, error } = await client
      .from(this.tableName)
      .insert([followData])
      .select('*')
      .single()

    if (error) {
      handleSupabaseError(error)
    }

    if (!data) {
      handleSupabaseError(new Error('Failed to follow user'))
    }

    return data as FollowRow
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(client: DbClient, followerId: string, followingId: string): Promise<void> {
    const { error } = await client
      .from(this.tableName)
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)

    if (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Check if a user follows another user
   */
  async isFollowing(
    client: DbClient,
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    const { data, error } = await client
      .from(this.tableName)
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return false
      }
      handleSupabaseError(error)
    }

    return !!data
  }

  /**
   * Get followers of a user with profile info
   */
  async getFollowers(
    client: DbClient,
    userId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<FollowWithProfile[]> {
    let query = client
      .from(this.tableName)
      .select(
        `
        *,
        follower_profile:profiles!follows_follower_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('following_id', userId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 20) - 1
      )
    }

    const { data, error } = await query

    if (error) {
      handleSupabaseError(error)
    }

    return (data ?? []) as FollowWithProfile[]
  }

  /**
   * Get users that a user is following with profile info
   */
  async getFollowing(
    client: DbClient,
    userId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<FollowWithProfile[]> {
    let query = client
      .from(this.tableName)
      .select(
        `
        *,
        following_profile:profiles!follows_following_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 20) - 1
      )
    }

    const { data, error } = await query

    if (error) {
      handleSupabaseError(error)
    }

    return (data ?? []) as FollowWithProfile[]
  }

  /**
   * Get follower count for a user
   */
  async getFollowerCount(client: DbClient, userId: string): Promise<number> {
    const { count, error } = await client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    if (error) {
      handleSupabaseError(error)
    }

    return count ?? 0
  }

  /**
   * Get following count for a user
   */
  async getFollowingCount(client: DbClient, userId: string): Promise<number> {
    const { count, error } = await client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    if (error) {
      handleSupabaseError(error)
    }

    return count ?? 0
  }
}

// Export singleton instance
export const followRepository = new FollowRepository()
