// ABOUTME: WebRTC signaling API - send/receive SDP offers, answers, ICE candidates
// ABOUTME: Database-based signaling for P2P connection establishment

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'
import { z } from 'zod'

type RouteContext = {
  params: Promise<{ spaceId: string }>
}

const signalSchema = z.object({
  toUserId: z.string().uuid().optional(), // null = broadcast
  messageType: z.enum(['offer', 'answer', 'ice-candidate']),
  payload: z.any(), // SDP or ICE candidate data
})

/**
 * POST /api/spaces/[spaceId]/signal
 * Send a WebRTC signaling message
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

    // Verify user is in the space
    const { data: participant } = await supabase
      .from('space_participants')
      .select('id')
      .eq('space_id', spaceId)
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    const body = await request.json()
    const validatedInput = signalSchema.parse(body)

    // Send signal
    const { data: signal, error } = await supabase
      .from('signaling_messages')
      .insert({
        space_id: spaceId,
        from_user_id: user.id,
        to_user_id: validatedInput.toUserId || null,
        message_type: validatedInput.messageType,
        payload: validatedInput.payload,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: signal }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/spaces/[spaceId]/signal
 * Get pending signaling messages for current user
 */
export async function GET(
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

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since') // Timestamp to get messages after

    let query = supabase
      .from('signaling_messages')
      .select('*')
      .eq('space_id', spaceId)
      .or(`to_user_id.eq.${user.id},to_user_id.is.null`)
      .eq('delivered', false)
      .order('created_at', { ascending: true })

    if (since) {
      query = query.gt('created_at', since)
    }

    const { data: signals, error } = await query

    if (error) throw error

    // Mark as delivered
    if (signals && signals.length > 0) {
      await supabase
        .from('signaling_messages')
        .update({ delivered: true })
        .in('id', signals.map((s) => s.id))
    }

    return NextResponse.json({ success: true, data: signals })
  } catch (error) {
    return handleApiError(error)
  }
}
