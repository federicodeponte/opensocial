// ABOUTME: React Query hook for user analytics
// ABOUTME: Fetches and caches user statistics and engagement metrics

import { useQuery } from '@tanstack/react-query'
import type { UserAnalytics } from '@/app/api/analytics/me/route'

/**
 * Fetch current user's analytics
 */
export function useUserAnalytics() {
  return useQuery<UserAnalytics>({
    queryKey: ['analytics', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/me')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch analytics')
      }

      const { data } = await response.json()
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
