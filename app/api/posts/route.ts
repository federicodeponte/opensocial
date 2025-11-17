// ABOUTME: API routes for creating and fetching posts
// ABOUTME: Uses service layer for business logic, handles authentication and validation

import { createClient } from '@/lib/auth/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { postService } from '@/lib/services/post-service'
import { handleApiError } from '@/lib/errors/error-handler'
import { AuthenticationError } from '@/lib/errors/app-error'

const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(280, 'Content must be 280 characters or less'),
  replyToId: z.string().uuid('Invalid post ID').optional(),
})

const getPostsSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    const validatedInput = createPostSchema.parse(body)

    const post = await postService.createPost(supabase, user.id, {
      content: validatedInput.content,
      replyToId: validatedInput.replyToId,
    })

    return NextResponse.json({ data: post }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get current user for filtering muted/blocked users
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const validatedParams = getPostsSchema.parse({
      userId: searchParams.get('userId') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    })

    const posts = await postService.getFeedPosts(supabase, {
      userId: validatedParams.userId,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
      currentUserId: user?.id,
    })

    return NextResponse.json({ data: posts })
  } catch (error) {
    return handleApiError(error)
  }
}
