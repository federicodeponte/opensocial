// ABOUTME: API route for joining communities
// ABOUTME: POST /api/communities/[communityId]/join

import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/lib/services/community-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    const membership = await communityService.joinCommunity(communityId, userId)

    return NextResponse.json({ success: true, data: membership }, { status: 201 })
  } catch (error: any) {
    console.error('Error joining community:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to join community' },
      { status: 500 }
    )
  }
}
