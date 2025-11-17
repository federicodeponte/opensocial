// ABOUTME: Trending hashtags widget component
// ABOUTME: Displays top trending hashtags in sidebar

'use client'

import { useTrendingHashtags } from '@/lib/hooks/useHashtags'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export function TrendingHashtags() {
  const { data: hashtags, isLoading, error } = useTrendingHashtags(5)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Trending</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !hashtags || hashtags.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Trending</h2>
      <div className="space-y-3">
        {hashtags.map((hashtag, index) => (
          <Link
            key={hashtag.id}
            href={`/hashtag/${hashtag.tag}`}
            className="block hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">
                  {index + 1} · Trending
                </div>
                <div className="font-bold text-gray-900 truncate">
                  #{hashtag.tag}
                </div>
                <div className="text-sm text-gray-500">
                  {hashtag.recent_count} {hashtag.recent_count === 1 ? 'post' : 'posts'} today
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/hashtags/explore"
        className="block mt-4 text-blue-600 hover:underline text-sm"
      >
        Show more
      </Link>
    </div>
  )
}
