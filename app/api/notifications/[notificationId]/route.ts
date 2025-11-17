// ABOUTME: API endpoint for individual notification operations
// ABOUTME: PATCH to mark as read, DELETE to remove

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

interface RouteContext {
  params: Promise<{ notificationId: string }>
}

/**
 * PATCH /api/notifications/[notificationId]
 * Mark a specific notification as read
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { notificationId } = await context.params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark as read (RLS ensures user owns this notification)
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('recipient_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/notifications/[notificationId]
 * Delete a specific notification
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { notificationId } = await context.params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete notification (RLS ensures user owns this notification)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return handleApiError(error)
  }
}
