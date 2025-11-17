// ABOUTME: API endpoint for retweeting and unretweeting posts
// ABOUTME: Supports both pure retweets and quote tweets with commentary

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { retweetService } from '@/lib/services/retweet-service'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * POST /api/posts/[postId]/retweet
 * Create a retweet or quote tweet
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body (optional quote content)
    const body = await request.json().catch(() => ({}))
    const { quoteContent } = body

    const retweet = await retweetService.createRetweet(supabase, user.id, {
      postId,
      quoteContent: quoteContent || null,
    })

    return NextResponse.json({ data: retweet })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/posts/[postId]/retweet
 * Remove a retweet (unretweet)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await retweetService.deleteRetweet(supabase, user.id, postId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
