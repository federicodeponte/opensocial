// ABOUTME: React Query hooks for muting and blocking users
// ABOUTME: Mute/unmute and block/unblock functionality

import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Mute a user
 */
export function useMuteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(`/api/profiles/${username}/mute`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mute user')
      }

      return response.json()
    },
    onSuccess: (_, username) => {
      // Invalidate profile and posts queries
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

/**
 * Unmute a user
 */
export function useUnmuteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(`/api/profiles/${username}/mute`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unmute user')
      }

      return response.json()
    },
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

/**
 * Block a user
 */
export function useBlockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(`/api/profiles/${username}/block`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to block user')
      }

      return response.json()
    },
    onSuccess: (_, username) => {
      // Invalidate profile, posts, and follows queries
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['followers'] })
      queryClient.invalidateQueries({ queryKey: ['following'] })
    },
  })
}

/**
 * Unblock a user
 */
export function useUnblockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(`/api/profiles/${username}/block`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unblock user')
      }

      return response.json()
    },
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
