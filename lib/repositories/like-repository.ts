// ABOUTME: Like repository handling post like/unlike operations
// ABOUTME: Manages user interactions with posts (likes)

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
import { handleSupabaseError } from '@/lib/errors/error-handler'

export type DbClient = SupabaseClient<Database>

type LikeRow = Database['public']['Tables']['likes']['Row']
type LikeInsert = Database['public']['Tables']['likes']['Insert']

export class LikeRepository {
  private readonly tableName = 'likes' as const

  /**
   * Like a post
   */
  async likePost(client: DbClient, userId: string, postId: string): Promise<LikeRow> {
    const likeData: LikeInsert = {
      user_id: userId,
      post_id: postId,
    }

    const { data, error } = await client
      .from(this.tableName)
      .insert([likeData])
      .select('*')
      .single()

    if (error) {
      handleSupabaseError(error)
    }

    if (!data) {
      handleSupabaseError(new Error('Failed to like post'))
    }

    return data as LikeRow
  }

  /**
   * Unlike a post
   */
  async unlikePost(client: DbClient, userId: string, postId: string): Promise<void> {
    const { error } = await client
      .from(this.tableName)
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)

    if (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Check if user has liked a post
   */
  async hasLikedPost(client: DbClient, userId: string, postId: string): Promise<boolean> {
    const { data, error } = await client
      .from(this.tableName)
      .select('user_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
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
   * Get users who liked a post
   */
  async getPostLikes(
    client: DbClient,
    postId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<LikeRow[]> {
    let query = client
      .from(this.tableName)
      .select('*')
      .eq('post_id', postId)
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

    return (data ?? []) as LikeRow[]
  }

  /**
   * Get posts liked by a user
   */
  async getUserLikes(
    client: DbClient,
    userId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<LikeRow[]> {
    let query = client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
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

    return (data ?? []) as LikeRow[]
  }

  /**
   * Get like count for a post
   */
  async getPostLikeCount(client: DbClient, postId: string): Promise<number> {
    const { count, error } = await client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    if (error) {
      handleSupabaseError(error)
    }

    return count ?? 0
  }
}

// Export singleton instance
export const likeRepository = new LikeRepository()
