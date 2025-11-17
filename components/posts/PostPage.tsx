// ABOUTME: Individual post page showing post details and replies
// ABOUTME: Displays full conversation thread with reply composer

'use client'

import { usePost, useReplies } from '@/lib/hooks/usePosts'
import { PostCard } from './PostCard'
import { PostComposer } from './PostComposer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PostPageProps {
  postId: string
}

export function PostPage({ postId }: PostPageProps) {
  const { data: post, isLoading: postLoading, error: postError } = usePost(postId)
  const { data: replies, isLoading: repliesLoading } = useReplies(postId)

  if (postLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading post...</div>
      </div>
    )
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">
              The post you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/home">
              <Button>Go to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/home">
            <Button variant="outline">← Back</Button>
          </Link>
        </div>

        {/* Main Post */}
        <div className="mb-6">
          <PostCard post={post} />
        </div>

        {/* Reply Composer */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Reply to this post</h2>
          <PostComposer
            replyToId={post.id}
            replyToUsername={post.profiles.username}
          />
        </div>

        {/* Replies Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Replies ({post.replies_count})
          </h2>

          {repliesLoading ? (
            <div className="text-center py-8 text-gray-600">Loading replies...</div>
          ) : !replies || replies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No replies yet. Be the first to reply!
            </div>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => (
                <PostCard key={reply.id} post={reply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
