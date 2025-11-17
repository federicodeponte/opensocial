// ABOUTME: React Query hooks for search functionality (users, posts, hashtags)
// ABOUTME: Provides type-safe search operations with caching and optimistic updates

'use client'

import { useQuery } from '@tanstack/react-query'
import type { Database } from '@/lib/types/database'
import type { PostWithProfile } from '@/lib/types/types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface ProfileWithFollowStatus extends ProfileRow {
  isFollowing?: boolean
  isOwnProfile?: boolean
}

interface SearchUsersParams {
  query: string
  limit?: number
  offset?: number
}

interface SearchPostsParams {
  query: string
  limit?: number
  offset?: number
  hasMedia?: boolean
  fromUser?: string
}

interface SuggestedUsersParams {
  limit?: number
}

/**
 * Search for users by query
 */
export function useSearchUsers({ query, limit = 20, offset = 0 }: SearchUsersParams) {
  return useQuery({
    queryKey: ['search', 'users', query, limit, offset],
    queryFn: async (): Promise<ProfileWithFollowStatus[]> => {
      if (!query || query.trim().length < 2) {
        return []
      }

      const params = new URLSearchParams({
        q: query.trim(),
        limit: limit.toString(),
        offset: offset.toString(),
      })

      const response = await fetch(`/api/search/users?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to search users')
      }

      const data = await response.json()
      return data.data
    },
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Search for posts by query
 */
export function useSearchPosts({ query, limit = 20, offset = 0, hasMedia, fromUser }: SearchPostsParams) {
  return useQuery({
    queryKey: ['search', 'posts', query, limit, offset, hasMedia, fromUser],
    queryFn: async (): Promise<PostWithProfile[]> => {
      if (!query || query.trim().length < 2) {
        return []
      }

      const params = new URLSearchParams({
        q: query.trim(),
        limit: limit.toString(),
        offset: offset.toString(),
      })

      if (hasMedia) {
        params.set('hasMedia', 'true')
      }

      if (fromUser) {
        params.set('fromUser', fromUser)
      }

      const response = await fetch(`/api/search/posts?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to search posts')
      }

      const data = await response.json()
      return data.data
    },
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Get suggested users to follow
 */
export function useSuggestedUsers({ limit = 10 }: SuggestedUsersParams = {}) {
  return useQuery({
    queryKey: ['search', 'suggested', limit],
    queryFn: async (): Promise<ProfileWithFollowStatus[]> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
      })

      const response = await fetch(`/api/search/suggested?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch suggested users')
      }

      const data = await response.json()
      return data.data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}
