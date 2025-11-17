// ABOUTME: Component to display quoted post preview inline
// ABOUTME: Shows quoted post's content and author with clickable link

'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { PostWithProfile } from '@/lib/types/types'
import { Card } from '@/components/ui/card'
import { ImageGallery } from '@/components/posts/ImageGallery'
import { PostContent } from '@/components/posts/PostContent'

interface QuotedPostCardProps {
  quotedPostId: string
}

export function QuotedPostCard({ quotedPostId }: QuotedPostCardProps) {
  const { data: quotedPost, isLoading } = useQuery<PostWithProfile>({
    queryKey: ['posts', quotedPostId],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${quotedPostId}`)
      const { data } = await response.json()
      return data
    },
  })

  if (isLoading) {
    return (
      <Card className="p-3 mt-2 border-gray-300 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </Card>
    )
  }

  if (!quotedPost) {
    return (
      <Card className="p-3 mt-2 border-gray-300">
        <p className="text-sm text-gray-500">Post not available</p>
      </Card>
    )
  }

  const timeAgo = formatDistanceToNow(new Date(quotedPost.created_at), {
    addSuffix: true,
  })

  return (
    <Link href={`/posts/${quotedPost.id}`} className="block mt-2">
      <Card className="p-3 border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer">
        {/* Author info */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
            {quotedPost.profiles.display_name?.[0]?.toUpperCase() ||
              quotedPost.profiles.username[0].toUpperCase()}
          </div>
          <span className="font-semibold text-sm">
            {quotedPost.profiles.display_name || quotedPost.profiles.username}
          </span>
          <span className="text-gray-500 text-sm">
            @{quotedPost.profiles.username}
          </span>
          <span className="text-gray-500 text-sm">·</span>
          <span className="text-gray-500 text-sm">{timeAgo}</span>
        </div>

        {/* Post content */}
        <PostContent content={quotedPost.content} className="text-sm text-gray-900" />

        {/* Images */}
        {quotedPost.image_urls && quotedPost.image_urls.length > 0 && (
          <div className="mt-2">
            <ImageGallery images={quotedPost.image_urls} />
          </div>
        )}
      </Card>
    </Link>
  )
}
