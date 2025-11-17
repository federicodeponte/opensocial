// ABOUTME: Profile repository handling all profile-related database operations
// ABOUTME: Provides type-safe methods for CRUD operations on user profiles

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
import { handleSupabaseError } from '@/lib/errors/error-handler'

export type DbClient = SupabaseClient<Database>

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export class ProfileRepository {
  private readonly tableName = 'profiles' as const

  /**
   * Get profile by ID
   */
  async getProfileById(client: DbClient, userId: string): Promise<ProfileRow | null> {
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      handleSupabaseError(error)
    }

    return data
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(client: DbClient, username: string): Promise<ProfileRow | null> {
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      handleSupabaseError(error)
    }

    return data
  }

  /**
   * Create a new profile
   */
  async createProfile(client: DbClient, data: ProfileInsert): Promise<ProfileRow> {
    const { data: result, error } = await client
      .from(this.tableName)
      .insert([data])
      .select('*')
      .single()

    if (error) {
      handleSupabaseError(error)
    }

    if (!result) {
      handleSupabaseError(new Error('Failed to create profile'))
    }

    return result as ProfileRow
  }

  /**
   * Update profile (user must own it - enforced by RLS)
   */
  async updateProfile(
    client: DbClient,
    userId: string,
    data: ProfileUpdate
  ): Promise<ProfileRow> {
    const { data: result, error } = await client
      .from(this.tableName)
      .update(data)
      .eq('id', userId)
      .select('*')
      .single()

    if (error) {
      handleSupabaseError(error)
    }

    if (!result) {
      handleSupabaseError(new Error('Failed to update profile'))
    }

    return result as ProfileRow
  }

  /**
   * Search profiles using full-text search with relevance ranking
   * Falls back to ILIKE for exact prefix matches
   */
  async searchProfiles(
    client: DbClient,
    query: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<ProfileRow[]> {
    // Sanitize query for tsquery (remove special chars, handle spaces)
    const sanitizedQuery = query
      .trim()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0)
      .join(' & ')

    if (!sanitizedQuery) {
      return []
    }

    // Use full-text search with ranking
    // Note: Using textSearch is not available in Supabase JS client yet,
    // so we use RPC function for proper FTS with ranking
    const { data, error } = await client.rpc('search_profiles', {
      search_query: sanitizedQuery,
      result_limit: options?.limit ?? 20,
      result_offset: options?.offset ?? 0,
    })

    if (error) {
      // Fallback to ILIKE if RPC fails (shouldn't happen in production)
      const fallbackQuery = client
        .from(this.tableName)
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .order('followers_count', { ascending: false })
        .limit(options?.limit ?? 20)

      if (options?.offset) {
        fallbackQuery.range(
          options.offset,
          options.offset + (options.limit ?? 20) - 1
        )
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery

      if (fallbackError) {
        handleSupabaseError(fallbackError)
      }

      return (fallbackData ?? []) as ProfileRow[]
    }

    return (data ?? []) as ProfileRow[]
  }

  /**
   * Get suggested users (most popular, not followed by current user)
   */
  async getSuggestedProfiles(
    client: DbClient,
    currentUserId: string,
    options?: {
      limit?: number
    }
  ): Promise<ProfileRow[]> {
    // Get profiles with high follower count, excluding current user
    // and profiles already followed by current user
    const { data, error } = await client.rpc('get_suggested_profiles', {
      current_user_id: currentUserId,
      result_limit: options?.limit ?? 10,
    })

    if (error) {
      // Fallback: simple query by follower count
      const { data: fallbackData, error: fallbackError } = await client
        .from(this.tableName)
        .select('*')
        .neq('id', currentUserId)
        .order('followers_count', { ascending: false })
        .limit(options?.limit ?? 10)

      if (fallbackError) {
        handleSupabaseError(fallbackError)
      }

      return (fallbackData ?? []) as ProfileRow[]
    }

    return (data ?? []) as ProfileRow[]
  }

  /**
   * Get multiple profiles by IDs
   */
  async getProfilesByIds(client: DbClient, userIds: string[]): Promise<ProfileRow[]> {
    if (userIds.length === 0) {
      return []
    }

    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .in('id', userIds)

    if (error) {
      handleSupabaseError(error)
    }

    return (data ?? []) as ProfileRow[]
  }
}

// Export singleton instance
export const profileRepository = new ProfileRepository()
