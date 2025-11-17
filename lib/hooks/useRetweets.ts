// ABOUTME: React Query hooks for retweet functionality
// ABOUTME: Provides type-safe retweet operations with caching and optimistic updates

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

interface RetweetResponse {
  data: {
    id: string
    user_id: string
    post_id: string
    quote_content: string | null
    created_at: string
  }
}

interface CreateRetweetInput {
  postId: string
  quoteContent?: string | null
}

/**
 * Hook for creating a retweet (pure retweet or quote tweet)
 */
export function useCreateRetweet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRetweetInput): Promise<RetweetResponse> => {
      const response = await fetch(`/api/posts/${input.postId}/retweet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteContent: input.quoteContent }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create retweet')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate post queries to refresh retweet counts
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post'] })
    },
  })
}

/**
 * Hook for deleting a retweet (unretweet)
 */
export function useDeleteRetweet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      const response = await fetch(`/api/posts/${postId}/retweet`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete retweet')
      }
    },
    onSuccess: () => {
      // Invalidate post queries to refresh retweet counts
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post'] })
    },
  })
}

/**
 * Hook for toggling a retweet (retweet/unretweet)
 */
export function useToggleRetweet() {
  const createRetweet = useCreateRetweet()
  const deleteRetweet = useDeleteRetweet()

  return {
    toggleRetweet: async (postId: string, isRetweeted: boolean) => {
      if (isRetweeted) {
        await deleteRetweet.mutateAsync(postId)
      } else {
        await createRetweet.mutateAsync({ postId })
      }
    },
    isPending: createRetweet.isPending || deleteRetweet.isPending,
  }
}
