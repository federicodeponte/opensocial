// ABOUTME: API routes for creating and fetching posts
// ABOUTME: Supports both global feed and user-specific posts

import { createClient } from '@/lib/auth/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1).max(280),
  replyToId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content, replyToId } = createPostSchema.parse(body)

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        reply_to_id: replyToId,
      })
      .select(
        `
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 400 }
    )
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    let query = supabase
      .from('posts')
      .select(
        `
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .is('reply_to_id', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch posts' },
      { status: 400 }
    )
  }
}
