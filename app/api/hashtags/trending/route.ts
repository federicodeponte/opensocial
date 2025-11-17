// ABOUTME: API endpoint for trending hashtags
// ABOUTME: Returns top hashtags by recent post count

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * GET /api/hashtags/trending
 * Get trending hashtags
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get current user (optional, for public viewing)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get trending hashtags from materialized view
    const { data: trending, error } = await supabase
      .from('trending_hashtags')
      .select('id, tag, post_count, recent_count, last_used_at')
      .order('recent_count', { ascending: false })
      .order('post_count', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return NextResponse.json({ data: trending })
  } catch (error) {
    return handleApiError(error)
  }
}
