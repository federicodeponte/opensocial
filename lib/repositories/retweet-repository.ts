// ABOUTME: Retweet repository handling all retweet-related database operations
// ABOUTME: Provides type-safe methods for creating, deleting, and querying retweets

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
import { handleSupabaseError } from '@/lib/errors/error-handler'

export type DbClient = SupabaseClient<Database>

type RetweetRow = Database['public']['Tables']['retweets']['Row']
type RetweetInsert = Database['public']['Tables']['retweets']['Insert']

export class RetweetRepository {
  private readonly tableName = 'retweets' as const

  /**
   * Create a retweet (pure retweet or quote tweet)
   */
  async createRetweet(
    client: DbClient,
    data: RetweetInsert
  ): Promise<RetweetRow> {
    const { data: result, error } = await client
      .from(this.tableName)
      .insert([data])
      .select('*')
      .single()

    if (error) {
      handleSupabaseError(error)
    }

    if (!result) {
      handleSupabaseError(new Error('Failed to create retweet'))
    }

    return result as RetweetRow
  }

  /**
   * Delete a retweet (unretweet)
   */
  async deleteRetweet(
    client: DbClient,
    userId: string,
    postId: string
  ): Promise<void> {
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
   * Check if user has retweeted a post
   */
  async hasRetweeted(
    client: DbClient,
    userId: string,
    postId: string
  ): Promise<boolean> {
    const { data, error } = await client
      .from(this.tableName)
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()

    if (error) {
      handleSupabaseError(error)
    }

    return data !== null
  }

  /**
   * Get user's retweet of a post (if exists)
   */
  async getUserRetweet(
    client: DbClient,
    userId: string,
    postId: string
  ): Promise<RetweetRow | null> {
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()

    if (error) {
      handleSupabaseError(error)
    }

    return data
  }

  /**
   * Get all retweets by a user (for user timeline)
   */
  async getUserRetweets(
    client: DbClient,
    userId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<RetweetRow[]> {
    let query = client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) {
      handleSupabaseError(error)
    }

    return (data ?? []) as RetweetRow[]
  }

  /**
   * Get all users who retweeted a post
   */
  async getPostRetweets(
    client: DbClient,
    postId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<RetweetRow[]> {
    let query = client
      .from(this.tableName)
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) {
      handleSupabaseError(error)
    }

    return (data ?? []) as RetweetRow[]
  }

  /**
   * Get retweet by ID
   */
  async getRetweetById(
    client: DbClient,
    retweetId: string
  ): Promise<RetweetRow | null> {
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('id', retweetId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      handleSupabaseError(error)
    }

    return data
  }
}

// Export singleton instance
export const retweetRepository = new RetweetRepository()
