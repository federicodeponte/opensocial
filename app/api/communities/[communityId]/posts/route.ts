// ABOUTME: API route for community posts
// ABOUTME: GET /api/communities/[communityId]/posts - list posts, POST - create post

import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/lib/services/community-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('userId') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const posts = await communityService.getPosts(communityId, userId, limit, offset)

    return NextResponse.json({ success: true, data: posts })
  } catch (error: any) {
    console.error('Error fetching community posts:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const body = await request.json()
    const { userId, content } = body

    if (!userId || !content) {
      return NextResponse.json(
        { success: false, error: 'User ID and content required' },
        { status: 400 }
      )
    }

    const post = await communityService.createPost(communityId, userId, content)

    return NextResponse.json({ success: true, data: post }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating community post:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create post' },
      { status: 500 }
    )
  }
}
