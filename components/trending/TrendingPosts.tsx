// ABOUTME: Trending posts widget showing popular posts
// ABOUTME: Displays top trending posts with engagement metrics

'use client'

import { useQuery } from '@tanstack/react-query'
import { PostCard } from '@/components/posts/PostCard'
import { Loader2, TrendingUp } from 'lucide-react'
import type { Post } from '@/lib/types/types'

interface TrendingPostsProps {
  window?: 'NOW' | 'TODAY' | 'WEEK'
  limit?: number
}

export function TrendingPosts({ window = 'TODAY', limit = 10 }: TrendingPostsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trending-posts', window, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/trending/posts?window=${window}&limit=${limit}`
      )
      if (!response.ok) throw new Error('Failed to fetch trending posts')
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        Failed to load trending posts
      </div>
    )
  }

  const posts = data?.posts || []

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No trending posts right now
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

/**
 * Compact trending posts widget for sidebar
 */
export function TrendingPostsWidget({ limit = 5 }: { limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['trending-posts-widget', limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/trending/posts?window=TODAY&limit=${limit}`
      )
      if (!response.ok) throw new Error('Failed to fetch trending posts')
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-bold text-lg">Trending Now</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const posts = data?.posts || []

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5" />
        <h3 className="font-bold text-lg">Trending Now</h3>
      </div>
      <div className="space-y-3">
        {posts.map((post: any, index: number) => (
          <a
            key={post.id}
            href={`/posts/${post.id}`}
            className="block hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <div className="flex items-start gap-2">
              <span className="text-sm font-bold text-gray-400">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>@{post.profiles?.username || 'user'}</span>
                  <span>•</span>
                  <span>{post.likes_count || 0} likes</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
