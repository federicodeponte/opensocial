import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { postService } from '@/lib/services/post-service'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * GET /api/posts/[postId]/replies
 * Get replies to a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const replies = await postService.getReplies(supabase, postId, { limit, offset })

    return NextResponse.json({ data: replies })
  } catch (error) {
    return handleApiError(error)
  }
}
