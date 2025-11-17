// ABOUTME: API endpoints for individual scheduled post operations
// ABOUTME: Update, delete, and cancel scheduled posts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * DELETE /api/scheduled-posts/[scheduledPostId]
 * Cancel/delete a scheduled post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scheduledPostId: string }> }
) {
  try {
    const supabase = await createClient()
    const { scheduledPostId } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete scheduled post (RLS ensures it's the user's post)
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', scheduledPostId)
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/scheduled-posts/[scheduledPostId]
 * Update a scheduled post
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scheduledPostId: string }> }
) {
  try {
    const supabase = await createClient()
    const { scheduledPostId } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse update data
    const body = await request.json()
    const updates: {
      content?: string
      scheduled_for?: string
      image_urls?: string[] | null
    } = {}

    if (body.content !== undefined) updates.content = body.content
    if (body.scheduledFor !== undefined) updates.scheduled_for = body.scheduledFor
    if (body.imageUrls !== undefined) updates.image_urls = body.imageUrls

    // Validate scheduled time is in future
    if (updates.scheduled_for && new Date(updates.scheduled_for) <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // Update scheduled post
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update(updates)
      .eq('id', scheduledPostId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}
