// ABOUTME: Bookmarks page showing user's saved posts
// ABOUTME: Displays all bookmarked posts in chronological order

'use client'

import { useBookmarks } from '@/lib/hooks/useBookmarks'
import { PostCard } from '@/components/posts/PostCard'
import Link from 'next/link'

export default function BookmarksPage() {
  const { data: bookmarks, isLoading, error } = useBookmarks()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-8">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-300 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Posts Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-300" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-300 rounded" />
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error loading bookmarks</h1>
            <p className="text-gray-600 mb-6">Could not load your bookmarked posts.</p>
            <Link href="/home" className="text-blue-600 hover:underline">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/home" className="text-blue-600 hover:underline">
              ← Back
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Bookmarks</h1>
          <p className="text-gray-600 mt-2">
            {bookmarks?.length || 0} {bookmarks?.length === 1 ? 'post' : 'posts'} saved
          </p>
        </div>

        {/* Posts */}
        {!bookmarks || bookmarks.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="text-gray-500 text-lg">No bookmarks yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Save posts to read them later by clicking the bookmark icon
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
