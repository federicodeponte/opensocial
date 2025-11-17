// ABOUTME: Post repository handling all post-related database operations
// ABOUTME: Provides type-safe methods for CRUD operations on posts

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
import { handleSupabaseError } from '@/lib/errors/error-handler'
import { PostWithProfile } from '@/lib/types/types'

export type DbClient = SupabaseClient<Database>

type PostRow = Database['public']['Tables']['posts']['Row']
type PostInsert = Database['public']['Tables']['posts']['Insert']

export class PostRepository {
  private readonly tableName = 'posts' as const

  /**
   * Create a new post
   */
  async createPost(
    client: DbClient,
    data: {
      userId: string
      content: string
      replyToId?: string | null
    }
  ): Promise<PostWithProfile> {
    const postData: PostInsert = {
      user_id: data.userId,
      content: data.content,
      reply_to_id: data.replyToId || null,
    }

    const { data: result, error } = await client
      .from(this.tableName)
      .insert([postData])
      .select(
        `
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .single()

    if (error) {
      handleSupabaseError(error)
    }

    if (!result) {
      handleSupabaseError(new Error('Failed to create post'))
    }

    return result as PostWithProfile
  }

  /**
   * Get posts for feed (no replies, ordered by created_at)
   */
  async getFeedPosts(
    client: DbClient,
    options?: {
      userId?: string
      limit?: number
      offset?: number
    }
  ): Promise<PostWithProfile[]> {
    let query = client
      .from(this.tableName)
      .select(
        `
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .is('reply_to_id', null)
      .order('created_at', { ascending: false })

    if (options?.userId) {
      query = query.eq('user_id', options.userId)
    }

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

    return (data ?? []) as PostWithProfile[]
  }

  /**
   * Get a single post by ID with profile
   */
  async getPostById(client: DbClient, postId: string): Promise<PostWithProfile | null> {
    const { data, error } = await client
      .from(this.tableName)
      .select(
        `
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('id', postId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      handleSupabaseError(error)
    }

    return data as PostWithProfile
  }

  /**
   * Get replies to a post
   */
  async getReplies(
    client: DbClient,
    postId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<PostWithProfile[]> {
    let query = client
      .from(this.tableName)
      .select(
        `
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('reply_to_id', postId)
      .order('created_at', { ascending: true })

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

    return (data ?? []) as PostWithProfile[]
  }

  /**
   * Delete a post (user must own it - enforced by RLS)
   */
  async deletePost(client: DbClient, postId: string): Promise<void> {
    const { error } = await client.from(this.tableName).delete().eq('id', postId)

    if (error) {
      handleSupabaseError(error)
    }
  }

  /**
   * Get post count for a user
   */
  async getUserPostCount(client: DbClient, userId: string): Promise<number> {
    const { count, error } = await client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      handleSupabaseError(error)
    }

    return count ?? 0
  }
}

// Export singleton instance
export const postRepository = new PostRepository()
