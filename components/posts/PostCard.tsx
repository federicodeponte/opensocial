'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { PostWithProfile } from '@/lib/types/types'
import { Card } from '@/components/ui/card'

interface PostCardProps {
  post: PostWithProfile
}

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  return (
    <Card className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex gap-3">
        {/* Avatar placeholder */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {post.profiles.display_name?.[0]?.toUpperCase() || post.profiles.username[0].toUpperCase()}
          </div>
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
            <span className="text-gray-500 text-sm">{timeAgo}</span>
          </div>

          <p className="mt-1 text-gray-900 whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {/* Engagement stats */}
          <div className="flex gap-6 mt-3 text-gray-500 text-sm">
            <button className="hover:text-blue-600 transition-colors">
              <span className="font-medium">{post.replies_count}</span> replies
            </button>
            <button className="hover:text-green-600 transition-colors">
              <span className="font-medium">{post.retweets_count}</span> retweets
            </button>
            <button className="hover:text-red-600 transition-colors">
              <span className="font-medium">{post.likes_count}</span> likes
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
