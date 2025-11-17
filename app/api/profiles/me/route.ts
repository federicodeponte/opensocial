import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { profileService } from '@/lib/services/profile-service'
import { handleApiError } from '@/lib/errors/error-handler'
import { AuthenticationError } from '@/lib/errors/app-error'
import { z } from 'zod'

/**
 * GET /api/profiles/me
 * Get current user's profile
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError()
    }

    const profile = await profileService.getProfileById(supabase, user.id, user.id)

    if (!profile) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: profile })
  } catch (error) {
    return handleApiError(error)
  }
}

const updateProfileSchema = z.object({
  display_name: z.string().max(50, 'Display name must be 50 characters or less').optional().nullable(),
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional().nullable(),
  avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
  header_url: z.string().url('Invalid header URL').optional().nullable(),
  location: z.string().max(30, 'Location must be 30 characters or less').optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
})

/**
 * PATCH /api/profiles/me
 * Update current user's profile
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    const validatedInput = updateProfileSchema.parse(body)

    const profile = await profileService.updateProfile(supabase, user.id, validatedInput)

    return NextResponse.json({ data: profile })
  } catch (error) {
    return handleApiError(error)
  }
}
