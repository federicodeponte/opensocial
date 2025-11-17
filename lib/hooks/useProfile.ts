// ABOUTME: React Query hooks for user profile operations
// ABOUTME: Provides data fetching, caching, and mutations for profiles

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Database } from '@/lib/types/database'
import { toast } from 'sonner'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface ProfileWithFollowStatus extends ProfileRow {
  isFollowing?: boolean
  isOwnProfile?: boolean
  isMuted?: boolean
  isBlocked?: boolean
}

export interface UpdateProfileInput {
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  header_url?: string | null
  location?: string | null
  website?: string | null
}

/**
 * Hook to fetch a profile by username
 */
export function useProfile(username: string | null) {
  return useQuery<ProfileWithFollowStatus>({
    queryKey: ['profile', username],
    queryFn: async () => {
      if (!username) throw new Error('Username is required')

      const response = await fetch(`/api/profiles/${username}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to fetch profile')
      }

      const { data } = await response.json()
      return data
    },
    enabled: !!username,
  })
}

/**
 * Hook to fetch current user's profile
 */
export function useCurrentProfile() {
  return useQuery<ProfileWithFollowStatus>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/profiles/me')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to fetch profile')
      }

      const { data } = await response.json()
      return data
    },
  })
}

/**
 * Hook to update current user's profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const response = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to update profile')
      }

      const { data } = await response.json()
      return data
    },
    onSuccess: (data) => {
      // Invalidate and refetch profile queries
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['profile', data.username] })
    },
  })
}

/**
 * Hook to follow a user
 */
export function useFollowUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(`/api/profiles/${username}/follow`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to follow user')
      }

      const { data } = await response.json()
      return data
    },
    onMutate: async (username: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile', username] })

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileWithFollowStatus>(['profile', username])

      // Optimistically update profile
      queryClient.setQueryData<ProfileWithFollowStatus>(['profile', username], (old) => {
        if (!old) return old
        return {
          ...old,
          isFollowing: true,
          followers_count: old.followers_count + 1,
        }
      })

      return { previousProfile, username }
    },
    onError: (err, _username, context) => {
      // Show error notification
      toast.error('Failed to follow user', {
        description: err instanceof Error ? err.message : 'Please try again',
      })

      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', context.username], context.previousProfile)
      }
    },
    onSettled: (_, __, username) => {
      // Refetch to ensure data is correct
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['followers', username] })
      queryClient.invalidateQueries({ queryKey: ['following'] })
    },
  })
}

/**
 * Hook to unfollow a user
 */
export function useUnfollowUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(`/api/profiles/${username}/follow`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to unfollow user')
      }

      const { data } = await response.json()
      return data
    },
    onMutate: async (username: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile', username] })

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileWithFollowStatus>(['profile', username])

      // Optimistically update profile
      queryClient.setQueryData<ProfileWithFollowStatus>(['profile', username], (old) => {
        if (!old) return old
        return {
          ...old,
          isFollowing: false,
          followers_count: Math.max(0, old.followers_count - 1),
        }
      })

      return { previousProfile, username }
    },
    onError: (err, _username, context) => {
      // Show error notification
      toast.error('Failed to unfollow user', {
        description: err instanceof Error ? err.message : 'Please try again',
      })

      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', context.username], context.previousProfile)
      }
    },
    onSettled: (_, __, username) => {
      // Refetch to ensure data is correct
      queryClient.invalidateQueries({ queryKey: ['profile', username] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['followers', username] })
      queryClient.invalidateQueries({ queryKey: ['following'] })
    },
  })
}

export interface FollowWithProfile {
  created_at: string
  follower_id: string
  following_id: string
  follower_profile?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  following_profile?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

/**
 * Hook to fetch followers of a user
 */
export function useFollowers(username: string | null, options?: { limit?: number; offset?: number }) {
  return useQuery<FollowWithProfile[]>({
    queryKey: ['followers', username, options?.limit, options?.offset],
    queryFn: async () => {
      if (!username) throw new Error('Username is required')

      const params = new URLSearchParams()
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.offset) params.set('offset', options.offset.toString())

      const response = await fetch(`/api/profiles/${username}/followers?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to fetch followers')
      }

      const { data } = await response.json()
      return data
    },
    enabled: !!username,
  })
}

/**
 * Hook to fetch users that a user is following
 */
export function useFollowing(username: string | null, options?: { limit?: number; offset?: number }) {
  return useQuery<FollowWithProfile[]>({
    queryKey: ['following', username, options?.limit, options?.offset],
    queryFn: async () => {
      if (!username) throw new Error('Username is required')

      const params = new URLSearchParams()
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.offset) params.set('offset', options.offset.toString())

      const response = await fetch(`/api/profiles/${username}/following?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to fetch following')
      }

      const { data } = await response.json()
      return data
    },
    enabled: !!username,
  })
}
