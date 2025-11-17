// ABOUTME: React Query hooks for content reporting
// ABOUTME: Create reports and view user's report history

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type ReportReason = 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'misinformation' | 'nsfw' | 'other'

export interface CreateReportInput {
  reportedPostId?: string
  reportedUserId?: string
  reason: ReportReason
  description?: string
}

export interface Report {
  id: string
  reporter_id: string
  reported_post_id: string | null
  reported_user_id: string | null
  reason: ReportReason
  description: string | null
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  created_at: string
  updated_at: string
  reported_post?: {
    id: string
    content: string
    user_id: string
    profiles: {
      username: string
      display_name: string | null
    }
  }
  reported_user?: {
    id: string
    username: string
    display_name: string | null
  }
}

/**
 * Hook to create a report
 */
export function useCreateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateReportInput) => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create report')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate reports list
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

/**
 * Hook to fetch user's reports
 */
export function useReports(options?: { limit?: number; offset?: number }) {
  return useQuery<Report[]>({
    queryKey: ['reports', options?.limit, options?.offset],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.offset) params.set('offset', options.offset.toString())

      const response = await fetch(`/api/reports?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch reports')
      }

      const { data } = await response.json()
      return data
    },
  })
}
