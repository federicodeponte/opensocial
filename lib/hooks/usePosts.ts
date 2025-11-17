// ABOUTME: React Query hooks for posts - fetching and creating posts
// ABOUTME: Handles optimistic updates and automatic cache invalidation

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostWithProfile, CreatePostInput } from '@/lib/types/types'

export function usePosts(userId?: string) {
  return useQuery({
    queryKey: ['posts', userId],
    queryFn: async () => {
      const params = userId ? `?userId=${userId}` : ''
      const response = await fetch(`/api/posts${params}`)
      if (!response.ok) throw new Error('Failed to fetch posts')
      const { data } = await response.json()
      return data as PostWithProfile[]
    },
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ content, replyToId }: CreatePostInput) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, replyToId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create post')
      }
      const { data } = await response.json()
      return data as PostWithProfile
    },
    onSuccess: () => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
