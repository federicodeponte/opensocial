// ABOUTME: Quote tweet modal allowing users to add commentary to a retweet
// ABOUTME: Shows embedded original post with composer for quote content

'use client'

import { useState } from 'react'
import { useCreateRetweet } from '@/lib/hooks/useRetweets'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { PostWithProfile } from '@/lib/types/types'

interface QuoteTweetModalProps {
  post: PostWithProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuoteTweetModal({ post, open, onOpenChange }: QuoteTweetModalProps) {
  const [quoteContent, setQuoteContent] = useState('')
  const createRetweet = useCreateRetweet()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quoteContent.trim()) {
      return
    }

    try {
      await createRetweet.mutateAsync({
        postId: post.id,
        quoteContent: quoteContent.trim(),
      })

      setQuoteContent('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create quote tweet:', error)
    }
  }

  const charactersRemaining = 280 - quoteContent.length
  const isOverLimit = charactersRemaining < 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quote Tweet</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quote content input */}
          <div>
            <textarea
              value={quoteContent}
              onChange={(e) => setQuoteContent(e.target.value)}
              placeholder="Add a comment..."
              className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={300}
            />
            <div
              className={`text-sm text-right mt-1 ${
                isOverLimit ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              {charactersRemaining}
            </div>
          </div>

          {/* Embedded original post */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {(post.profiles.display_name?.[0] || post.profiles.username[0]).toUpperCase()}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {post.profiles.display_name || post.profiles.username}
                  </span>
                  <span className="text-gray-500">@{post.profiles.username}</span>
                </div>

                <p className="mt-1 text-gray-900 whitespace-pre-wrap break-words">
                  {post.content}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createRetweet.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!quoteContent.trim() || isOverLimit || createRetweet.isPending}
            >
              {createRetweet.isPending ? 'Posting...' : 'Quote Tweet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
