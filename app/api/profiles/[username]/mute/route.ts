// ABOUTME: API endpoints for muting users
// ABOUTME: POST to mute, DELETE to unmute

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * POST /api/profiles/[username]/mute
 * Mute a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient()
    const { username } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get target user
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cannot mute yourself
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot mute yourself' },
        { status: 400 }
      )
    }

    // Mute the user
    const { error } = await supabase.from('muted_users').insert({
      user_id: user.id,
      muted_user_id: targetUser.id,
    })

    if (error) {
      // Ignore duplicate key errors
      if (!error.message.includes('duplicate key')) {
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/profiles/[username]/mute
 * Unmute a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient()
    const { username } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get target user
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Unmute the user
    const { error } = await supabase
      .from('muted_users')
      .delete()
      .eq('user_id', user.id)
      .eq('muted_user_id', targetUser.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
