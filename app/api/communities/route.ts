// ABOUTME: API route for communities - list and create
// ABOUTME: GET /api/communities - list with filters, POST - create new

import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/lib/services/community-service'
import type { CommunityType } from '@/lib/types/community'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      search: searchParams.get('search') || undefined,
      type: (searchParams.get('type') as CommunityType) || undefined,
      sort: (searchParams.get('sort') as 'newest' | 'popular' | 'members') || 'popular',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const communities = await communityService.getCommunities(filters)

    return NextResponse.json({ success: true, data: communities })
  } catch (error: any) {
    console.error('Error fetching communities:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch communities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, slug, description, type, coverImage, avatarUrl } = body

    if (!userId || !name || !slug || !description || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const community = await communityService.createCommunity(userId, {
      name,
      slug,
      description,
      type,
      coverImage,
      avatarUrl,
    })

    return NextResponse.json({ success: true, data: community }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating community:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create community' },
      { status: 500 }
    )
  }
}
