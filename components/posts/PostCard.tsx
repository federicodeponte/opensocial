'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { PostWithProfile } from '@/lib/types/types'
import { Card } from '@/components/ui/card'
import { useToggleLike } from '@/lib/hooks/usePosts'
import { useState } from 'react'

interface PostCardProps {
  post: PostWithProfile
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
  const toggleLike = useToggleLike()
  const [isLiked, setIsLiked] = useState(post.hasLiked || false)
  const [likeCount, setLikeCount] = useState(post.likes_count)

  const handleLike = async () => {
    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      await toggleLike.mutateAsync(post.id)
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked)
      setLikeCount(likeCount)
      console.error('Failed to toggle like:', error)
    }
  }

  return (
    <Card className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex gap-3">
        {/* Avatar placeholder */}
        <div className="flex-shrink-0">
          <Link href={`/${post.profiles.username}`}>
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-80 transition-opacity">
              {post.profiles.display_name?.[0]?.toUpperCase() || post.profiles.username[0].toUpperCase()}
            </div>
          </Link>
        </div>

        {/* Post content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/${post.profiles.username}`}
              className="font-semibold hover:underline"
            >
              {post.profiles.display_name || post.profiles.username}
            </Link>
            <Link
              href={`/${post.profiles.username}`}
              className="text-gray-500 hover:underline"
            >
              @{post.profiles.username}
            </Link>
            <span className="text-gray-500">·</span>
            <Link href={`/posts/${post.id}`} className="text-gray-500 text-sm hover:underline">
              {timeAgo}
            </Link>
          </div>

          <Link href={`/posts/${post.id}`} className="block">
            <p className="mt-1 text-gray-900 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          </Link>

          {/* Engagement stats */}
          <div className="flex gap-6 mt-3 text-gray-500 text-sm">
            <Link href={`/posts/${post.id}`} className="hover:text-blue-600 transition-colors">
              <span className="font-medium">{post.replies_count}</span> replies
            </Link>
            <button className="hover:text-green-600 transition-colors">
              <span className="font-medium">{post.retweets_count}</span> retweets
            </button>
            <button
              onClick={handleLike}
              className={`hover:text-red-600 transition-colors ${isLiked ? 'text-red-600' : ''}`}
              disabled={toggleLike.isPending}
            >
              <span className="font-medium">{likeCount}</span> {isLiked ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
