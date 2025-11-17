import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { likeService } from '@/lib/services/like-service'
import { handleApiError } from '@/lib/errors/error-handler'
import { AuthenticationError } from '@/lib/errors/app-error'

/**
 * POST /api/posts/[postId]/like
 * Like a post (or toggle like)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError()
    }

    const result = await likeService.toggleLike(supabase, user.id, postId)

    return NextResponse.json({ data: result })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/posts/[postId]/like
 * Unlike a post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError()
    }

    await likeService.unlikePost(supabase, user.id, postId)

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return handleApiError(error)
  }
}
