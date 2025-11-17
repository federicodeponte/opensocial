// ABOUTME: API endpoints for managing scheduled posts
// ABOUTME: Create, list, update, and delete scheduled posts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'
import { z } from 'zod'

const createScheduledPostSchema = z.object({
  content: z.string().min(1).max(280),
  scheduledFor: z.string().datetime(),
  imageUrls: z.array(z.string()).optional(),
  replyToId: z.string().uuid().optional(),
})

export interface ScheduledPost {
  id: string
  user_id: string
  content: string
  image_urls: string[] | null
  scheduled_for: string
  status: 'pending' | 'published' | 'failed' | 'cancelled'
  reply_to_id: string | null
  created_at: string
  published_post_id: string | null
  error_message: string | null
}

/**
 * POST /api/scheduled-posts
 * Create a new scheduled post
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate input
    const body = await request.json()
    const validatedInput = createScheduledPostSchema.parse(body)

    // Verify scheduled time is in the future
    const scheduledTime = new Date(validatedInput.scheduledFor)
    if (scheduledTime <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // Create scheduled post
    const { data: scheduledPost, error } = await supabase
      .from('scheduled_posts')
      .insert({
        user_id: user.id,
        content: validatedInput.content,
        image_urls: validatedInput.imageUrls || null,
        scheduled_for: validatedInput.scheduledFor,
        reply_to_id: validatedInput.replyToId || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data: scheduledPost }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/scheduled-posts
 * List current user's scheduled posts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: scheduledPosts, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ data: scheduledPosts })
  } catch (error) {
    return handleApiError(error)
  }
}
