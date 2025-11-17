// ABOUTME: React hooks for pinning and unpinning posts
// ABOUTME: Allows users to pin one post to their profile

import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Pin a post to user's profile
 */
export function usePinPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/pin`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to pin post')
      }

      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      // Invalidate profile queries to refetch pinned post
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

/**
 * Unpin a post from user's profile
 */
export function useUnpinPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/pin`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unpin post')
      }

      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      // Invalidate profile queries to refetch
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

/**
 * Toggle pin status of a post
 */
export function useTogglePin() {
  const pinPost = usePinPost()
  const unpinPost = useUnpinPost()

  return useMutation({
    mutationFn: async ({ postId, isPinned }: { postId: string; isPinned: boolean }) => {
      if (isPinned) {
        return unpinPost.mutateAsync(postId)
      } else {
        return pinPost.mutateAsync(postId)
      }
    },
  })
}
