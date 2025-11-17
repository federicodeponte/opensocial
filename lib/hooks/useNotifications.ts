// ABOUTME: React Query hooks for notifications with Realtime
// ABOUTME: Fetch, mark as read, and manage notification state with live updates

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/auth/supabase-client'

export interface Notification {
  id: string
  type: 'like' | 'retweet' | 'follow' | 'reply' | 'mention' | 'quote'
  read: boolean
  created_at: string
  post_id: string | null
  sender: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

/**
 * Hook to fetch notifications with Realtime updates
 */
export function useNotifications(options?: { limit?: number; unreadOnly?: boolean }) {
  const queryClient = useQueryClient()

  const query = useQuery<Notification[]>({
    queryKey: ['notifications', options?.limit, options?.unreadOnly],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.unreadOnly) params.set('unread', 'true')

      const response = await fetch(`/api/notifications?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch notifications')
      }
      const { data } = await response.json()
      return data
    },
  })

  // Subscribe to real-time notification updates
  useEffect(() => {
    const supabase = createClient()

    // Get current user to filter notifications
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return

      const channel = supabase
        .channel('notifications-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${data.user.id}`,
          },
          () => {
            // Invalidate all notification queries when new notification arrives
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${data.user.id}`,
          },
          () => {
            // Invalidate when notification is marked as read
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    })
  }, [queryClient])

  return query
}

/**
 * Hook to get unread notification count
 */
export function useUnreadCount() {
  const { data: notifications } = useNotifications({ unreadOnly: true })
  return notifications?.length || 0
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark as read')
      }
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      // Invalidate notifications to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Hook to mark a specific notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark as read')
      }
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      // Invalidate notifications to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete notification')
      }
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      // Invalidate notifications to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
