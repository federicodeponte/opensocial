// ABOUTME: Infinite scroll feed component using IntersectionObserver
// ABOUTME: Automatically loads more posts as user scrolls down

'use client'

import { useEffect, useRef } from 'react'
import { useInfinitePosts } from '@/lib/hooks/usePosts'
import { PostCard } from './PostCard'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface InfiniteFeedProps {
  userId?: string
}

export function InfiniteFeed({ userId }: InfiniteFeedProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfinitePosts(userId)

  const observerTarget = useRef<HTMLDivElement>(null)

  // Set up IntersectionObserver to load more posts when scrolling to bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 1.0 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error loading posts</h3>
          <p className="text-sm text-gray-600">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </Card>
    )
  }

  // Empty state
  const allPosts = data?.pages.flatMap((page) => page) ?? []
  if (allPosts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No posts yet</h3>
          <p className="text-sm text-gray-500">
            {userId
              ? "This user hasn't posted anything yet."
              : 'Be the first to share something!'}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Render all posts from all pages */}
      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Loading indicator at bottom */}
      {isFetchingNextPage && (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading more posts...</span>
          </div>
        </Card>
      )}

      {/* Intersection observer target */}
      <div ref={observerTarget} className="h-4" />

      {/* End of feed indicator */}
      {!hasNextPage && allPosts.length > 0 && (
        <Card className="p-4">
          <p className="text-center text-sm text-gray-500">
            You&apos;ve reached the end of the feed
          </p>
        </Card>
      )}
    </div>
  )
}
