// ABOUTME: Component for displaying polls with voting UI
// ABOUTME: Shows vote counts, percentages, and allows voting

'use client'

import { usePoll, useVotePoll, useRemoveVote } from '@/lib/hooks/usePolls'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PollDisplayProps {
  pollId: string
  className?: string
}

export function PollDisplay({ pollId, className = '' }: PollDisplayProps) {
  const { data: poll, isLoading } = usePoll(pollId)
  const votePoll = useVotePoll()
  const removeVote = useRemoveVote()

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    )
  }

  if (!poll) {
    return null
  }

  const hasVoted = poll.user_voted_option_id !== null
  const isExpired = poll.is_expired

  const handleVote = (optionId: string) => {
    if (isExpired) return
    votePoll.mutate({ pollId: poll.id, optionId })
  }

  const handleRemoveVote = () => {
    if (isExpired) return
    removeVote.mutate(pollId)
  }

  const getPercentage = (voteCount: number) => {
    if (poll.total_votes === 0) return 0
    return Math.round((voteCount / poll.total_votes) * 100)
  }

  const formatTimeRemaining = () => {
    if (!poll.expires_at) return 'No expiration'

    const now = new Date()
    const expiresAt = new Date(poll.expires_at)
    const diff = expiresAt.getTime() - now.getTime()

    if (diff <= 0) return 'Poll ended'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`
    return 'Less than 1 hour left'
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Poll Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.vote_count)
          const isSelected = option.id === poll.user_voted_option_id
          const isLeading =
            poll.total_votes > 0 &&
            option.vote_count ===
              Math.max(...poll.options.map((o) => o.vote_count))

          return (
            <button
              key={option.id}
              onClick={() => !hasVoted && !isExpired && handleVote(option.id)}
              disabled={isExpired || votePoll.isPending}
              className={cn(
                'relative w-full text-left rounded-lg border transition-all',
                'hover:border-primary disabled:cursor-not-allowed',
                isSelected && 'border-primary bg-primary/5',
                !hasVoted && !isExpired && 'cursor-pointer hover:bg-accent'
              )}
            >
              {/* Background bar for votes */}
              {hasVoted && (
                <div
                  className={cn(
                    'absolute inset-0 rounded-lg transition-all',
                    isLeading ? 'bg-primary/20' : 'bg-muted'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Content */}
              <div className="relative flex items-center justify-between p-3">
                <div className="flex items-center gap-2 flex-1">
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                  <span
                    className={cn(
                      'font-medium',
                      isSelected && 'text-primary',
                      isLeading && hasVoted && 'font-semibold'
                    )}
                  >
                    {option.option_text}
                  </span>
                </div>

                {hasVoted && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {option.vote_count} vote{option.vote_count !== 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold min-w-[3ch] text-right">
                      {percentage}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Poll Metadata */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}
          </span>
          {poll.expires_at && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTimeRemaining()}
            </span>
          )}
        </div>

        {hasVoted && !isExpired && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveVote}
            disabled={removeVote.isPending}
            className="h-auto py-1 px-2 text-sm"
          >
            Remove vote
          </Button>
        )}
      </div>
    </div>
  )
}
