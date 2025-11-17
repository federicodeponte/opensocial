// ABOUTME: API endpoint for recording post views
// ABOUTME: POST to record a view (idempotent - unique per user)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * POST /api/posts/[postId]/view
 * Record a view for a post (unique per user)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createClient()
    const { postId } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if post exists
    const { data: post } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Record view (will be unique due to constraint)
    const { error: viewError } = await supabase
      .from('post_views')
      .insert({
        post_id: postId,
        user_id: user.id,
      })

    // Ignore duplicate key errors (user already viewed)
    if (viewError && !viewError.message.includes('duplicate key')) {
      throw viewError
    }

    // Get updated view count
    const { data: updatedPost } = await supabase
      .from('posts')
      .select('views_count')
      .eq('id', postId)
      .single()

    return NextResponse.json({
      data: {
        views_count: updatedPost?.views_count || 0,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
