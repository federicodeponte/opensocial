import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { profileService } from '@/lib/services/profile-service'
import { handleApiError } from '@/lib/errors/error-handler'
import { AuthenticationError, NotFoundError } from '@/lib/errors/app-error'

/**
 * POST /api/profiles/[username]/follow
 * Follow a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError()
    }

    // Get target user's profile
    const targetProfile = await profileService.getProfileByUsername(supabase, username)

    if (!targetProfile) {
      throw new NotFoundError('User not found')
    }

    await profileService.followUser(supabase, user.id, targetProfile.id)

    return NextResponse.json({ data: { success: true } }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/profiles/[username]/follow
 * Unfollow a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError()
    }

    // Get target user's profile
    const targetProfile = await profileService.getProfileByUsername(supabase, username)

    if (!targetProfile) {
      throw new NotFoundError('User not found')
    }

    await profileService.unfollowUser(supabase, user.id, targetProfile.id)

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return handleApiError(error)
  }
}
