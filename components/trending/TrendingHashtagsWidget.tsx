// ABOUTME: Trending hashtags widget for sidebar
// ABOUTME: Shows popular hashtags with post counts and links

'use client'

import { useQuery } from '@tanstack/react-query'
import { Hash, TrendingUp, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface TrendingHashtag {
  id: string
  tag: string
  post_count: number
  recent_count: number
  last_used_at: string
}

interface TrendingHashtagsWidgetProps {
  limit?: number
}

export function TrendingHashtagsWidget({ limit = 5 }: TrendingHashtagsWidgetProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trending-hashtags', limit],
    queryFn: async () => {
      const response = await fetch(`/api/hashtags/trending?limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch trending hashtags')
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-bold text-lg">Trending Hashtags</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-bold text-lg">Trending Hashtags</h3>
        </div>
        <div className="text-center py-4 text-sm text-gray-500">
          Failed to load hashtags
        </div>
      </div>
    )
  }

  const hashtags = data?.data || []

  if (hashtags.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-bold text-lg">Trending Hashtags</h3>
        </div>
        <div className="text-center py-4 text-sm text-gray-500">
          No trending hashtags right now
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5" />
        <h3 className="font-bold text-lg">Trending Hashtags</h3>
      </div>
      <div className="space-y-1">
        {hashtags.map((hashtag: TrendingHashtag, index: number) => (
          <Link
            key={hashtag.id}
            href={`/hashtag/${hashtag.tag}`}
            className="block hover:bg-gray-100 dark:hover:bg-gray-700 p-3 rounded-lg transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-sm font-bold text-gray-400 mt-1">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-sm">#{hashtag.tag}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatPostCount(hashtag.recent_count || hashtag.post_count)} posts
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/explore"
        className="block mt-3 text-sm text-blue-500 hover:underline"
      >
        Show more
      </Link>
    </div>
  )
}

function formatPostCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
