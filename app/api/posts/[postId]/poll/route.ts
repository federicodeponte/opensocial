// ABOUTME: API endpoint for retrieving poll data for a specific post
// ABOUTME: Returns 404 if post has no poll

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'
import type { PollData, PollOption } from '@/app/api/polls/[pollId]/route'

/**
 * GET /api/posts/[postId]/poll
 * Get poll for a specific post
 */
export async function GET(
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

    // Get poll for this post
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('post_id', postId)
      .maybeSingle()

    if (pollError) {
      throw pollError
    }

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Get poll options
    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', poll.id)
      .order('position', { ascending: true })

    if (optionsError) {
      throw optionsError
    }

    // Get all votes
    const { data: votes } = await supabase
      .from('poll_votes')
      .select('option_id, user_id')
      .eq('poll_id', poll.id)

    // Count votes per option
    const voteCounts: Record<string, number> = {}
    votes?.forEach((vote) => {
      voteCounts[vote.option_id] = (voteCounts[vote.option_id] || 0) + 1
    })

    // Find user's vote
    const userVote = votes?.find((vote) => vote.user_id === user.id)

    // Build options with vote counts
    const optionsWithCounts: PollOption[] =
      options?.map((option) => ({
        id: option.id,
        option_text: option.option_text,
        position: option.position,
        vote_count: voteCounts[option.id] || 0,
      })) || []

    // Check if expired
    const isExpired =
      poll.expires_at !== null && new Date(poll.expires_at) < new Date()

    const pollData: PollData = {
      id: poll.id,
      post_id: poll.post_id,
      expires_at: poll.expires_at || null,
      created_at: poll.created_at || new Date().toISOString(),
      options: optionsWithCounts,
      total_votes: votes?.length || 0,
      user_voted_option_id: userVote?.option_id || null,
      is_expired: isExpired,
    }

    return NextResponse.json({ data: pollData })
  } catch (error) {
    return handleApiError(error)
  }
}
