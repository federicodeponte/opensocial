// ABOUTME: React Query hooks for bookmarks
// ABOUTME: Fetch bookmarks and toggle bookmark status

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Hook to fetch user's bookmarked posts
 */
export function useBookmarks(limit: number = 50) {
  return useQuery<any[]>({
    queryKey: ['bookmarks', limit],
    queryFn: async () => {
      const response = await fetch(`/api/bookmarks?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks')
      }
      const { data } = await response.json()
      return data
    },
  })
}

/**
 * Hook to toggle bookmark on a post
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to toggle bookmark')
      }
      const data = await response.json()
      return data
    },
    onSuccess: () => {
      // Invalidate bookmarks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      // Invalidate posts queries to update bookmark status
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
