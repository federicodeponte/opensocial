// ABOUTME: API endpoint for pinning/unpinning posts to user profile
// ABOUTME: POST to pin, DELETE to unpin

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

interface RouteContext {
  params: Promise<{ postId: string }>
}

/**
 * POST /api/posts/[postId]/pin
 * Pin a post to the user's profile
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { postId } = await context.params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify post exists and belongs to user
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only pin your own posts' },
        { status: 403 }
      )
    }

    // Update profile to pin this post
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ pinned_post_id: postId })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      data: { postId, pinned: true },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/posts/[postId]/pin
 * Unpin a post from the user's profile
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { postId } = await context.params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update profile to unpin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ pinned_post_id: null })
      .eq('id', user.id)
      .eq('pinned_post_id', postId) // Only unpin if this post is currently pinned

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      data: { postId, pinned: false },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
