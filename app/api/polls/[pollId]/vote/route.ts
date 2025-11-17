// ABOUTME: API endpoint for voting on polls
// ABOUTME: POST to vote, DELETE to remove vote, allows changing votes

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

export interface VotePollInput {
  optionId: string
}

/**
 * POST /api/polls/[pollId]/vote
 * Vote on a poll or change existing vote
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const supabase = await createClient()
    const { optionId }: VotePollInput = await request.json()
    const { pollId } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate option belongs to poll
    const { data: option } = await supabase
      .from('poll_options')
      .select('poll_id')
      .eq('id', optionId)
      .single()

    if (!option || option.poll_id !== pollId) {
      return NextResponse.json(
        { error: 'Invalid poll option' },
        { status: 400 }
      )
    }

    // Check if poll has expired
    const { data: poll } = await supabase
      .from('polls')
      .select('expires_at')
      .eq('id', pollId)
      .single()

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Poll has expired' },
        { status: 400 }
      )
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Delete existing vote if changing vote
    if (existingVote) {
      await supabase.from('poll_votes').delete().eq('id', existingVote.id)
    }

    // Insert new vote
    const { data: vote, error: voteError } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      })
      .select()
      .single()

    if (voteError) {
      throw voteError
    }

    // Get updated vote counts
    const { data: voteCounts } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId)

    // Count votes per option
    const counts: Record<string, number> = {}
    voteCounts?.forEach((v) => {
      counts[v.option_id] = (counts[v.option_id] || 0) + 1
    })

    return NextResponse.json({
      data: {
        vote,
        voteCounts: counts,
        totalVotes: voteCounts?.length || 0,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/polls/[pollId]/vote
 * Remove vote from poll
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const supabase = await createClient()
    const { pollId } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user's vote
    const { error } = await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
