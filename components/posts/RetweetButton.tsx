// ABOUTME: Retweet button component with dropdown for pure retweet or quote tweet
// ABOUTME: Handles retweet state with optimistic updates

'use client'

import { useState } from 'react'
import { useToggleRetweet } from '@/lib/hooks/useRetweets'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RetweetButtonProps {
  postId: string
  hasRetweeted?: boolean
  retweetCount: number
  onQuoteClick?: () => void
}

export function RetweetButton({
  postId,
  hasRetweeted: initialHasRetweeted = false,
  retweetCount: initialRetweetCount,
  onQuoteClick,
}: RetweetButtonProps) {
  const [hasRetweeted, setHasRetweeted] = useState(initialHasRetweeted)
  const [retweetCount, setRetweetCount] = useState(initialRetweetCount)
  const { toggleRetweet, isPending } = useToggleRetweet()

  const handleRetweet = async () => {
    // Optimistic update
    setHasRetweeted(!hasRetweeted)
    setRetweetCount(hasRetweeted ? retweetCount - 1 : retweetCount + 1)

    try {
      await toggleRetweet(postId, hasRetweeted)
    } catch (error) {
      // Revert on error
      setHasRetweeted(hasRetweeted)
      setRetweetCount(retweetCount)
      console.error('Failed to toggle retweet:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          className={`hover:text-green-600 transition-colors ${
            hasRetweeted ? 'text-green-600' : 'text-gray-500'
          }`}
        >
          <span className="font-medium">{retweetCount}</span>
          <span className="ml-1">retweets</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={handleRetweet} disabled={isPending}>
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {hasRetweeted ? 'Unretweet' : 'Retweet'}
        </DropdownMenuItem>
        {onQuoteClick && (
          <DropdownMenuItem onClick={onQuoteClick}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            Quote Tweet
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
