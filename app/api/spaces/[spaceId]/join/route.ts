// ABOUTME: Join/leave audio space operations
// ABOUTME: Participant management for audio spaces

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

type RouteContext = {
  params: Promise<{ spaceId: string }>
}

/**
 * POST /api/spaces/[spaceId]/join
 * Join an audio space
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { spaceId } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if space exists and is joinable
    const { data: space } = await supabase
      .from('audio_spaces')
      .select('id, status, max_participants, participant_count')
      .eq('id', spaceId)
      .single()

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    if (space.status === 'ended') {
      return NextResponse.json({ error: 'Space has ended' }, { status: 400 })
    }

    if (space.participant_count >= space.max_participants) {
      return NextResponse.json({ error: 'Space is full' }, { status: 400 })
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('space_participants')
      .select('id')
      .eq('space_id', spaceId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already joined' }, { status: 400 })
    }

    // Join space
    const { data: participant, error } = await supabase
      .from('space_participants')
      .insert({
        space_id: spaceId,
        user_id: user.id,
        role: 'listener',
        is_connected: true,
      })
      .select()
      .single()

    if (error) throw error

    // Send peer-joined signal to all participants
    await supabase.from('signaling_messages').insert({
      space_id: spaceId,
      from_user_id: user.id,
      to_user_id: null, // Broadcast to all
      message_type: 'peer-joined',
      payload: { userId: user.id },
    })

    return NextResponse.json({ success: true, data: participant }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/spaces/[spaceId]/join
 * Leave an audio space
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { spaceId } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Leave space
    const { error } = await supabase
      .from('space_participants')
      .delete()
      .eq('space_id', spaceId)
      .eq('user_id', user.id)

    if (error) throw error

    // Send peer-left signal to all participants
    await supabase.from('signaling_messages').insert({
      space_id: spaceId,
      from_user_id: user.id,
      to_user_id: null, // Broadcast to all
      message_type: 'peer-left',
      payload: { userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
