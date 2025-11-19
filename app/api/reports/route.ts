// ABOUTME: API endpoints for content reporting
// ABOUTME: POST to create report, GET to list user's reports, auto-moderate with FREE tools

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'
import { z } from 'zod'
import { moderateContent, calculateSpamScore } from '@/lib/utils/content-moderation'

const createReportSchema = z.object({
  reportedPostId: z.string().uuid().optional(),
  reportedUserId: z.string().uuid().optional(),
  reason: z.enum(['spam', 'harassment', 'hate_speech', 'violence', 'misinformation', 'nsfw', 'other']),
  description: z.string().max(500).optional(),
}).refine(
  (data) => (data.reportedPostId && !data.reportedUserId) || (!data.reportedPostId && data.reportedUserId),
  { message: 'Must report either a post or a user, not both' }
)

/**
 * POST /api/reports
 * Create a new report
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

    const body = await request.json()
    const validatedInput = createReportSchema.parse(body)

    // Verify reported content exists and auto-moderate
    let autoModerationResult = null
    if (validatedInput.reportedPostId) {
      const { data: post } = await supabase
        .from('posts')
        .select('id, content')
        .eq('id', validatedInput.reportedPostId)
        .single()

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      // Auto-moderate the reported post content
      const modResult = moderateContent(post.content || '')
      const spamScore = calculateSpamScore(post.content || '')

      autoModerationResult = {
        ...modResult,
        spamScore,
      }

      // Auto-hide if moderation fails or spam score is high
      if (!modResult.approved || spamScore > 70) {
        await supabase
          .from('posts')
          .update({ content: '[Content hidden by auto-moderation]' })
          .eq('id', validatedInput.reportedPostId)
      }
    }

    if (validatedInput.reportedUserId) {
      const { data: reportedUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', validatedInput.reportedUserId)
        .single()

      if (!reportedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Cannot report yourself
      if (reportedUser.id === user.id) {
        return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
      }
    }

    // Create report
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_post_id: validatedInput.reportedPostId || null,
        reported_user_id: validatedInput.reportedUserId || null,
        reason: validatedInput.reason,
        description: validatedInput.description || null,
      })
      .select()
      .single()

    if (error) {
      // Check for duplicate report
      if (error.message.includes('unique_post_report') || error.message.includes('unique_user_report')) {
        return NextResponse.json({ error: 'You have already reported this content' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      data: report,
      autoModeration: autoModerationResult,
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/reports
 * Get user's reports
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

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's reports with related data
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        *,
        reported_post:reported_post_id (
          id,
          content,
          user_id,
          profiles:user_id (username, display_name)
        ),
        reported_user:reported_user_id (
          id,
          username,
          display_name
        )
      `)
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: reports })
  } catch (error) {
    return handleApiError(error)
  }
}
