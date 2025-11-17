// ABOUTME: API endpoint for retrieving poll data and results
// ABOUTME: GET to fetch poll with options and vote counts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

export interface PollOption {
  id: string
  option_text: string
  position: number
  vote_count: number
}

export interface PollData {
  id: string
  post_id: string
  expires_at: string | null
  created_at: string
  options: PollOption[]
  total_votes: number
  user_voted_option_id: string | null
  is_expired: boolean
}

/**
 * GET /api/polls/[pollId]
 * Get poll with options and vote counts
 */
export async function GET(
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

    // Get poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Get poll options
    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('position', { ascending: true })

    if (optionsError) {
      throw optionsError
    }

    // Get all votes
    const { data: votes } = await supabase
      .from('poll_votes')
      .select('option_id, user_id')
      .eq('poll_id', pollId)

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
