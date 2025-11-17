// ABOUTME: React hooks for tracking post views
// ABOUTME: Automatically records views when posts are displayed

import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

/**
 * Record a view for a post
 */
export function useRecordView() {
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/view`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record view')
      }

      const { data } = await response.json()
      return data
    },
  })
}

/**
 * Hook to automatically record view when post is visible
 * Uses IntersectionObserver to track when post enters viewport
 */
export function useAutoRecordView(postId: string, enabled: boolean = true) {
  const recordView = useRecordView()
  const hasRecorded = useRef(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || hasRecorded.current || !elementRef.current) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Record view when post is 50% visible
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (!hasRecorded.current) {
              hasRecorded.current = true
              recordView.mutate(postId)
              observer.disconnect()
            }
          }
        })
      },
      {
        threshold: 0.5, // Trigger when 50% visible
        rootMargin: '0px',
      }
    )

    observer.observe(elementRef.current)

    return () => {
      observer.disconnect()
    }
  }, [postId, enabled, recordView])

  return { elementRef, hasRecorded: hasRecorded.current }
}
