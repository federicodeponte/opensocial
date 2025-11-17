import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { profileService } from '@/lib/services/profile-service'
import { handleApiError } from '@/lib/errors/error-handler'
import { NotFoundError } from '@/lib/errors/app-error'

/**
 * GET /api/profiles/[username]/followers
 * Get a user's followers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get target user's profile
    const targetProfile = await profileService.getProfileByUsername(supabase, username)

    if (!targetProfile) {
      throw new NotFoundError('User not found')
    }

    const followers = await profileService.getFollowers(supabase, targetProfile.id, {
      limit,
      offset,
    })

    return NextResponse.json({ data: followers })
  } catch (error) {
    return handleApiError(error)
  }
}
