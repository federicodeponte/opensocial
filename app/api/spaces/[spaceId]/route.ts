// ABOUTME: Individual audio space operations - get, update, end space
// ABOUTME: Space-level actions and management

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

type RouteContext = {
  params: Promise<{ spaceId: string }>
}

/**
 * GET /api/spaces/[spaceId]
 * Get space details with participants
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

    // Get space with host and participants
    const { data: space, error } = await supabase
      .from('audio_spaces')
      .select(`
        *,
        host:host_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        participants:space_participants (
          id,
          user_id,
          role,
          is_muted,
          is_hand_raised,
          is_connected,
          joined_at,
          user:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', spaceId)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: space })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/spaces/[spaceId]
 * Update space (host only)
 */
export async function PATCH(
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

    const body = await request.json()

    // Verify user is host
    const { data: space } = await supabase
      .from('audio_spaces')
      .select('host_id')
      .eq('id', spaceId)
      .single()

    if (!space || space.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: updatedSpace, error } = await supabase
      .from('audio_spaces')
      .update(body)
      .eq('id', spaceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: updatedSpace })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/spaces/[spaceId]
 * End and delete space (host only)
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

    // Verify user is host
    const { data: space } = await supabase
      .from('audio_spaces')
      .select('host_id')
      .eq('id', spaceId)
      .single()

    if (!space || space.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark as ended instead of deleting
    const { error } = await supabase
      .from('audio_spaces')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', spaceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
