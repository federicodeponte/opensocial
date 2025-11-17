// ABOUTME: React hook for fetching link previews from post content
// ABOUTME: Automatically extracts URLs and fetches preview metadata

'use client'

import { useState, useEffect } from 'react'
import { extractUrls, isImageUrl, type LinkPreview } from '@/lib/utils/link-preview'

/**
 * Hook to fetch link preview for URLs in content
 * @param content - Post content to extract URLs from
 * @returns Link preview data or null if no URLs found
 */
export function useLinkPreview(content: string) {
  const [preview, setPreview] = useState<LinkPreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPreview = async () => {
      // Extract URLs from content
      const urls = extractUrls(content)

      // No URLs found
      if (urls.length === 0) {
        setPreview(null)
        return
      }

      // Get first non-image URL
      const targetUrl = urls.find(url => !isImageUrl(url))

      if (!targetUrl) {
        setPreview(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(targetUrl)}`)

        if (!response.ok) {
          throw new Error('Failed to fetch preview')
        }

        const { data } = await response.json()
        setPreview(data)
      } catch (err) {
        console.error('Error fetching link preview:', err)
        setError(err instanceof Error ? err.message : 'Failed to load preview')
        setPreview(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [content])

  return { preview, isLoading, error }
}
