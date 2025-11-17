'use client'

import { useState } from 'react'
import { useCreatePost } from '@/lib/hooks/usePosts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function PostComposer() {
  const [content, setContent] = useState('')
  const createPost = useCreatePost()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      await createPost.mutateAsync({ content })
      setContent('')
    } catch (error) {
      // Error is already displayed via createPost.isError
      // No need to log - React Query handles error state
    }
  }

  const charCount = content.length
  const maxChars = 280
  const remaining = maxChars - charCount
  const isOverLimit = remaining < 0

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          className="w-full min-h-[100px] text-lg resize-none border-none focus:outline-none focus:ring-0"
          disabled={createPost.isPending}
        />
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div
            className={`text-sm ${
              isOverLimit
                ? 'text-red-600 font-semibold'
                : remaining < 20
                ? 'text-yellow-600'
                : 'text-gray-500'
            }`}
          >
            {remaining} characters remaining
          </div>
          <Button
            type="submit"
            disabled={!content.trim() || isOverLimit || createPost.isPending}
          >
            {createPost.isPending ? 'Posting...' : 'Post'}
          </Button>
        </div>
        {createPost.isError && (
          <div className="text-sm text-red-600">
            {createPost.error instanceof Error ? createPost.error.message : 'Failed to post'}
          </div>
        )}
      </form>
    </Card>
  )
}
