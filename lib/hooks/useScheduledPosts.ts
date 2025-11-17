// ABOUTME: React Query hooks for scheduled posts
// ABOUTME: Create, list, update, and delete scheduled posts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ScheduledPost } from '@/app/api/scheduled-posts/route'

/**
 * Fetch user's scheduled posts
 */
export function useScheduledPosts(status?: 'pending' | 'published' | 'failed' | 'cancelled') {
  const params = new URLSearchParams()
  if (status) params.set('status', status)

  return useQuery<ScheduledPost[]>({
    queryKey: ['scheduled-posts', status],
    queryFn: async () => {
      const response = await fetch(`/api/scheduled-posts?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch scheduled posts')
      }

      const { data } = await response.json()
      return data
    },
  })
}

/**
 * Create a scheduled post
 */
export function useCreateScheduledPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      content,
      scheduledFor,
      imageUrls,
      replyToId,
    }: {
      content: string
      scheduledFor: string
      imageUrls?: string[]
      replyToId?: string
    }) => {
      const response = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, scheduledFor, imageUrls, replyToId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create scheduled post')
      }

      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
    },
  })
}

/**
 * Update a scheduled post
 */
export function useUpdateScheduledPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      content,
      scheduledFor,
      imageUrls,
    }: {
      id: string
      content?: string
      scheduledFor?: string
      imageUrls?: string[]
    }) => {
      const response = await fetch(`/api/scheduled-posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, scheduledFor, imageUrls }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update scheduled post')
      }

      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
    },
  })
}

/**
 * Delete a scheduled post
 */
export function useDeleteScheduledPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/scheduled-posts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete scheduled post')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
    },
  })
}
