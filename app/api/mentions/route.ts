// ABOUTME: API endpoint for creating and managing @mentions in posts
// ABOUTME: Handles saving mentions to database and creating notifications

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { extractMentions } from '@/lib/utils/mentionParser'

/**
 * POST /api/mentions
 * Create mentions for a post
 * Body: { postId: string, content: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId, content } = await request.json()

    if (!postId || !content) {
      return NextResponse.json({ error: 'postId and content are required' }, { status: 400 })
    }

    // Extract mentions from content
    const mentionedUsernames = extractMentions(content)

    if (mentionedUsernames.length === 0) {
      return NextResponse.json({ data: { mentions: [], count: 0 } })
    }

    // Find user IDs for mentioned usernames
    const { data: mentionedUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', mentionedUsernames)

    if (usersError) {
      console.error('Error fetching mentioned users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch mentioned users' }, { status: 500 })
    }

    if (!mentionedUsers || mentionedUsers.length === 0) {
      return NextResponse.json({ data: { mentions: [], count: 0 } })
    }

    // Create mention records
    const mentionsToCreate = mentionedUsers.map((mentionedUser) => ({
      post_id: postId,
      mentioned_user_id: mentionedUser.id,
    }))

    const { data: mentions, error: mentionsError } = await supabase
      .from('mentions')
      .insert(mentionsToCreate)
      .select()

    if (mentionsError) {
      console.error('Error creating mentions:', mentionsError)
      return NextResponse.json({ error: 'Failed to create mentions' }, { status: 500 })
    }

    // TODO: Create notifications for mentioned users
    // This will be implemented when we add the notifications system

    return NextResponse.json({
      data: {
        mentions,
        count: mentions?.length || 0,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/mentions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/mentions?postId=xxx
 * Get mentions for a specific post
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    const { data: mentions, error } = await supabase
      .from('mentions')
      .select(
        `
        id,
        created_at,
        mentioned_user:profiles!mentioned_user_id (
          id,
          username,
          display_name,
          avatar_url,
          verified
        )
      `
      )
      .eq('post_id', postId)

    if (error) {
      console.error('Error fetching mentions:', error)
      return NextResponse.json({ error: 'Failed to fetch mentions' }, { status: 500 })
    }

    return NextResponse.json({ data: mentions || [] })
  } catch (error) {
    console.error('Error in GET /api/mentions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
