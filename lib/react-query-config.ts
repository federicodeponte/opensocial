// ABOUTME: Optimized React Query configuration
// ABOUTME: Custom cache settings and query client setup for performance

import { QueryClient } from '@tanstack/react-query'

/**
 * Create optimized Query Client with custom defaults
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh (5 minutes)
        staleTime: 5 * 60 * 1000,

        // Cache time - how long inactive data stays in cache (10 minutes)
        gcTime: 10 * 60 * 1000,

        // Retry failed requests
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus (good for active users)
        refetchOnWindowFocus: true,

        // Don't refetch on mount if data is fresh
        refetchOnMount: false,

        // Refetch on reconnect (network recovery)
        refetchOnReconnect: true,

        // Network mode
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations on failure
        retry: 1,
        retryDelay: 1000,

        // Network mode
        networkMode: 'online',
      },
    },
  })
}

/**
 * Custom query keys for better organization and cache invalidation
 */
export const queryKeys = {
  // Posts
  posts: {
    all: ['posts'] as const,
    byUser: (userId: string) => ['posts', userId] as const,
    byId: (postId: string) => ['posts', postId] as const,
    replies: (postId: string) => ['posts', postId, 'replies'] as const,
  },

  // Profiles
  profiles: {
    all: ['profiles'] as const,
    byUsername: (username: string) => ['profiles', username] as const,
    me: ['profiles', 'me'] as const,
    followers: (username: string) => ['profiles', username, 'followers'] as const,
    following: (username: string) => ['profiles', username, 'following'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: ['notifications', 'unread'] as const,
  },

  // Messages
  messages: {
    conversations: ['conversations'] as const,
    byId: (conversationId: string) => ['messages', conversationId] as const,
  },

  // Hashtags
  hashtags: {
    trending: ['hashtags', 'trending'] as const,
    byTag: (tag: string) => ['hashtags', tag] as const,
  },

  // Bookmarks
  bookmarks: {
    all: ['bookmarks'] as const,
  },

  // Search
  search: {
    users: (query: string) => ['search', 'users', query] as const,
    suggested: ['search', 'suggested'] as const,
  },

  // Polls
  polls: {
    byId: (pollId: string) => ['polls', pollId] as const,
    byPost: (postId: string) => ['polls', 'post', postId] as const,
  },
}

/**
 * Prefetch strategies for common navigation paths
 */
export const prefetchStrategies = {
  // Prefetch user's profile when viewing feed
  prefetchProfile: async (queryClient: QueryClient, username: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.profiles.byUsername(username),
      queryFn: async () => {
        const response = await fetch(`/api/profiles/${username}`)
        const { data } = await response.json()
        return data
      },
      staleTime: 5 * 60 * 1000,
    })
  },

  // Prefetch notifications on app load
  prefetchNotifications: async (queryClient: QueryClient) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.notifications.unread,
      queryFn: async () => {
        const response = await fetch('/api/notifications?unread=true')
        const { data } = await response.json()
        return data
      },
      staleTime: 1 * 60 * 1000, // 1 minute for notifications
    })
  },
}
