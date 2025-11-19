// ABOUTME: Audio spaces API - create, list, join/leave spaces
// ABOUTME: FREE WebRTC P2P alternative to Agora ($0 vs $10/mo)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'
import { z } from 'zod'

const createSpaceSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  maxParticipants: z.number().min(2).max(50).default(50),
  scheduledFor: z.string().datetime().optional(),
})

/**
 * POST /api/spaces
 * Create a new audio space
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedInput = createSpaceSchema.parse(body)

    const { data: space, error } = await supabase
      .from('audio_spaces')
      .insert({
        host_id: user.id,
        title: validatedInput.title,
        description: validatedInput.description,
        is_public: validatedInput.isPublic,
        max_participants: validatedInput.maxParticipants,
        scheduled_for: validatedInput.scheduledFor,
        status: validatedInput.scheduledFor ? 'scheduled' : 'live',
        started_at: validatedInput.scheduledFor ? null : new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Auto-join host as participant
    await supabase.from('space_participants').insert({
      space_id: space.id,
      user_id: user.id,
      role: 'host',
      is_connected: true,
    })

    return NextResponse.json({ success: true, data: space }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/spaces
 * List audio spaces (active, scheduled, or user's spaces)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'active' // active, scheduled, my-spaces
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    let query = supabase
      .from('audio_spaces')
      .select(`
        *,
        host:host_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (filter === 'active') {
      query = query.eq('status', 'live')
    } else if (filter === 'scheduled') {
      query = query.eq('status', 'scheduled')
    } else if (filter === 'my-spaces') {
      query = query.eq('host_id', user.id)
    }

    const { data: spaces, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: spaces })
  } catch (error) {
    return handleApiError(error)
  }
}
