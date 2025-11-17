import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { profileService } from '@/lib/services/profile-service'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * GET /api/profiles/[username]
 * Get a user profile by username
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const supabase = await createClient()

    // Get current user (optional - for follow status)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const profile = await profileService.getProfileByUsername(
      supabase,
      username,
      user?.id
    )

    if (!profile) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Profile not found' } }, { status: 404 })
    }

    return NextResponse.json({ data: profile })
  } catch (error) {
    return handleApiError(error)
  }
}
