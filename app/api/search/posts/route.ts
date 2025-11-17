// ABOUTME: API endpoint for searching posts
// ABOUTME: Supports full-text search with filters

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * GET /api/search/posts
 * Search posts by content
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const hasMedia = searchParams.get('hasMedia') === 'true'
    const fromUser = searchParams.get('fromUser')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        error: 'Query must be at least 2 characters'
      }, { status: 400 })
    }

    // Build query
    let queryBuilder = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (hasMedia) {
      queryBuilder = queryBuilder.not('image_urls', 'eq', '{}')
    }

    if (fromUser) {
      // Get user ID from username
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', fromUser)
        .single()

      if (userProfile) {
        queryBuilder = queryBuilder.eq('user_id', userProfile.id)
      } else {
        return NextResponse.json({ data: [] })
      }
    }

    const { data: posts, error } = await queryBuilder

    if (error) {
      throw error
    }

    return NextResponse.json({ data: posts || [] })
  } catch (error) {
    return handleApiError(error)
  }
}
