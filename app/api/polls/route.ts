// ABOUTME: API endpoints for creating polls
// ABOUTME: POST to create a poll with options

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

export interface CreatePollInput {
  postId: string
  options: string[]
  expiresInHours?: number
}

/**
 * POST /api/polls
 * Create a poll for a post
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { postId, options, expiresInHours }: CreatePollInput = await request.json()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate input
    if (!postId || !options || options.length < 2 || options.length > 4) {
      return NextResponse.json(
        { error: 'Poll must have 2-4 options' },
        { status: 400 }
      )
    }

    // Verify user owns the post
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (!post || post.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Post not found or not authorized' },
        { status: 403 }
      )
    }

    // Calculate expiration
    let expiresAt = null
    if (expiresInHours) {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
    }

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        post_id: postId,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (pollError) {
      throw pollError
    }

    // Create poll options
    const pollOptions = options.map((text, index) => ({
      poll_id: poll.id,
      option_text: text,
      position: index,
    }))

    const { data: createdOptions, error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions)
      .select()

    if (optionsError) {
      throw optionsError
    }

    return NextResponse.json({
      data: {
        poll,
        options: createdOptions,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
