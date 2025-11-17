// ABOUTME: API endpoint for fetching link preview metadata
// ABOUTME: Returns Open Graph data for URL cards in posts

import { NextResponse } from 'next/server'
import { fetchLinkPreview } from '@/lib/utils/link-preview'

/**
 * GET /api/link-preview?url=...
 * Fetch link preview metadata for a URL
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Fetch preview data
    const preview = await fetchLinkPreview(url)

    return NextResponse.json({ data: preview })
  } catch (error) {
    console.error('Error in GET /api/link-preview:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch link preview' },
      { status: 500 }
    )
  }
}
