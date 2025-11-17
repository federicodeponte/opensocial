// ABOUTME: API endpoint for toggling post bookmark
// ABOUTME: POST to bookmark/unbookmark a post

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

interface RouteContext {
  params: Promise<{ postId: string }>
}

/**
 * POST /api/posts/[postId]/bookmark
 * Toggle bookmark on a post
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

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle()

    if (postError) {
      throw postError
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle()

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', existingBookmark.id)

      if (deleteError) {
        throw deleteError
      }

      return NextResponse.json({ bookmarked: false })
    } else {
      // Add bookmark
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          post_id: postId,
        })

      if (insertError) {
        throw insertError
      }

      return NextResponse.json({ bookmarked: true })
    }
  } catch (error) {
    return handleApiError(error)
  }
}
