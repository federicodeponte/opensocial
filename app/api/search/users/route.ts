// ABOUTME: API endpoint for searching user profiles using full-text search
// ABOUTME: Supports query parameter with limit/offset pagination

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { profileService } from '@/lib/services/profile-service'
import { handleApiError } from '@/lib/errors/error-handler'
import { ValidationError } from '@/lib/errors/app-error'

/**
 * GET /api/search/users?q=query&limit=20&offset=0
 * Search for user profiles using full-text search
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query) {
      throw new ValidationError('Search query parameter "q" is required')
    }

    // Get current user (optional - for follow status)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const profiles = await profileService.searchProfiles(supabase, query, {
      limit,
      offset,
    })

    // Add follow status for each profile if user is logged in
    const profilesWithStatus = await Promise.all(
      profiles.map(async (profile) => {
        if (!user || user.id === profile.id) {
          return {
            ...profile,
            isFollowing: false,
            isOwnProfile: user?.id === profile.id,
          }
        }

        const followProfile = await profileService.getProfileById(
          supabase,
          profile.id,
          user.id
        )

        return {
          ...profile,
          isFollowing: followProfile?.isFollowing || false,
          isOwnProfile: false,
        }
      })
    )

    return NextResponse.json({ data: profilesWithStatus })
  } catch (error) {
    return handleApiError(error)
  }
}
