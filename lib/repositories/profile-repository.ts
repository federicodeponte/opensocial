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
   * Search profiles by username (partial match)
   */
  async searchProfiles(
    client: DbClient,
    query: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<ProfileRow[]> {
    let dbQuery = client
      .from(this.tableName)
      .select('*')
      .ilike('username', `%${query}%`)
      .order('followers_count', { ascending: false })

    if (options?.limit) {
      dbQuery = dbQuery.limit(options.limit)
    }

    if (options?.offset) {
      dbQuery = dbQuery.range(
        options.offset,
        options.offset + (options.limit ?? 20) - 1
      )
    }

    const { data, error } = await dbQuery

    if (error) {
      handleSupabaseError(error)
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
