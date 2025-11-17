// ABOUTME: Wrapper component to conditionally display polls in posts
// ABOUTME: Fetches and displays poll if post has one

'use client'

import { usePollByPostId } from '@/lib/hooks/usePolls'
import { PollDisplay } from '@/components/posts/PollDisplay'

interface PostPollSectionProps {
  postId: string
}

export function PostPollSection({ postId }: PostPollSectionProps) {
  const { data: poll, isLoading } = usePollByPostId(postId)

  if (isLoading) {
    return null // Don't show loading state
  }

  if (!poll) {
    return null // No poll for this post
  }

  return (
    <div className="mt-3">
      <PollDisplay pollId={poll.id} />
    </div>
  )
}
