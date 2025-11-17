import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { postService } from '@/lib/services/post-service'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * GET /api/posts/[postId]
 * Get a single post by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const supabase = await createClient()

    const post = await postService.getPostById(supabase, postId)

    if (!post) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: post })
  } catch (error) {
    return handleApiError(error)
  }
}
