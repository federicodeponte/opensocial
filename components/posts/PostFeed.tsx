'use client'

import { usePosts } from '@/lib/hooks/usePosts'
import { PostCard } from './PostCard'

export function PostFeed() {
  const { data: posts, isLoading, error } = usePosts()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Failed to load posts. Please try again.
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No posts yet</p>
        <p className="text-sm mt-1">Be the first to post something!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
