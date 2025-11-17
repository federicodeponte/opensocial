'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { PostWithProfile } from '@/lib/types/types'
import { Card } from '@/components/ui/card'
import { useToggleLike } from '@/lib/hooks/usePosts'
import { useToggleBookmark } from '@/lib/hooks/useBookmarks'
import { RetweetButton } from '@/components/posts/RetweetButton'
import { QuoteTweetModal } from '@/components/posts/QuoteTweetModal'
import { ImageGallery } from '@/components/posts/ImageGallery'
import { PostContent } from '@/components/posts/PostContent'
import { PostPollSection } from '@/components/posts/PostPollSection'
import { QuotedPostCard } from '@/components/posts/QuotedPostCard'
import { PostActionsMenu } from '@/components/posts/PostActionsMenu'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { LinkPreviewCard } from '@/components/posts/LinkPreviewCard'
import { useState } from 'react'
import { useAutoRecordView } from '@/lib/hooks/usePostViews'
import { useCurrentProfile } from '@/lib/hooks/useProfile'
import { useLinkPreview } from '@/lib/hooks/useLinkPreview'

interface PostCardProps {
  post: PostWithProfile
  isPinned?: boolean
}

export function PostCard({ post, isPinned = false }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
  const toggleLike = useToggleLike()
  const toggleBookmark = useToggleBookmark()
  const [isLiked, setIsLiked] = useState(post.hasLiked || false)
  const [likeCount, setLikeCount] = useState(post.likes_count)
  const [isBookmarked, setIsBookmarked] = useState(false) // TODO: Add to post data
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)

  // Get current user to check if this is their post
  const { data: currentProfile } = useCurrentProfile()
  const isOwnPost = currentProfile?.id === post.user_id

  // Auto-record view when post is visible
  const { elementRef } = useAutoRecordView(post.id)

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

  const handleBookmark = async () => {
    // Optimistic update
    setIsBookmarked(!isBookmarked)

    try {
      await toggleBookmark.mutateAsync(post.id)
    } catch (error) {
      // Revert on error
      setIsBookmarked(isBookmarked)
      console.error('Failed to toggle bookmark:', error)
    }
  }

  return (
    <Card ref={elementRef} className="p-4 hover:bg-gray-50 transition-colors">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPinned && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  📌 Pinned
                </span>
              )}
              <Link
                href={`/${post.profiles.username}`}
                className="font-semibold hover:underline flex items-center gap-1"
              >
                {post.profiles.display_name || post.profiles.username}
                {post.profiles.verified && <VerifiedBadge size="sm" />}
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
            <PostActionsMenu
              postId={post.id}
              isOwnPost={isOwnPost}
              isPinned={isPinned}
            />
          </div>

          <Link href={`/posts/${post.id}`} className="block">
            <PostContent content={post.content} className="mt-1 text-gray-900" />
          </Link>

          {/* Image Gallery */}
          {post.image_urls && post.image_urls.length > 0 && (
            <ImageGallery images={post.image_urls} />
          )}

          {/* Quoted Post */}
          {post.quote_of_id && <QuotedPostCard quotedPostId={post.quote_of_id} />}

          {/* Poll */}
          <PostPollSection postId={post.id} />

          {/* Engagement stats */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-6 text-gray-500 text-sm">
              <Link href={`/posts/${post.id}`} className="hover:text-blue-600 transition-colors">
                <span className="font-medium">{post.replies_count}</span> replies
              </Link>
              <RetweetButton
                postId={post.id}
                hasRetweeted={post.hasRetweeted}
                retweetCount={post.retweets_count}
                onQuoteClick={() => setQuoteModalOpen(true)}
              />
              <button
                onClick={handleLike}
                className={`hover:text-red-600 transition-colors ${isLiked ? 'text-red-600' : ''}`}
                disabled={toggleLike.isPending}
              >
                <span className="font-medium">{likeCount}</span> {isLiked ? '❤️' : '🤍'}
              </button>
            </div>
            <button
              onClick={handleBookmark}
              className={`hover:text-blue-600 transition-colors ${isBookmarked ? 'text-blue-600' : 'text-gray-500'}`}
              disabled={toggleBookmark.isPending}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              {isBookmarked ? '🔖' : '📑'}
            </button>
          </div>
        </div>
      </div>

      {/* Quote Tweet Modal */}
      <QuoteTweetModal
        post={post}
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
      />
    </Card>
  )
}
