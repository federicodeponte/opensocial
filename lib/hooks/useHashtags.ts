// ABOUTME: React Query hooks for hashtags
// ABOUTME: Fetch trending hashtags and posts by hashtag

'use client'

import { useQuery } from '@tanstack/react-query'

export interface Hashtag {
  id: string
  tag: string
  post_count: number
  recent_count: number
  last_used_at: string
}

export interface HashtagPosts {
  hashtag: {
    id: string
    tag: string
  }
  posts: any[] // Using Post type from usePosts
}

/**
 * Hook to fetch trending hashtags
 */
export function useTrendingHashtags(limit: number = 10) {
  return useQuery<Hashtag[]>({
    queryKey: ['hashtags', 'trending', limit],
    queryFn: async () => {
      const response = await fetch(`/api/hashtags/trending?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trending hashtags')
      }
      const { data } = await response.json()
      return data
    },
    refetchInterval: 60000, // Refetch every minute
  })
}

/**
 * Hook to fetch posts by hashtag
 */
export function useHashtagPosts(tag: string, limit: number = 50) {
  return useQuery<HashtagPosts>({
    queryKey: ['hashtags', tag, limit],
    queryFn: async () => {
      const response = await fetch(`/api/hashtags/${encodeURIComponent(tag)}?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch hashtag posts')
      }
      const { data } = await response.json()
      return data
    },
    enabled: !!tag,
  })
}
