// ABOUTME: API endpoint for getting suggested users to follow
// ABOUTME: Returns popular users not followed by the current user

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { profileService } from '@/lib/services/profile-service'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * GET /api/search/suggested?limit=10
 * Get suggested users to follow (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profiles = await profileService.getSuggestedProfiles(supabase, user.id, {
      limit,
    })

    // Add follow status to suggested profiles (always false since they're not followed)
    const profilesWithStatus = profiles.map((profile) => ({
      ...profile,
      isFollowing: false,
      isOwnProfile: false,
    }))

    return NextResponse.json({ data: profilesWithStatus })
  } catch (error) {
    return handleApiError(error)
  }
}
