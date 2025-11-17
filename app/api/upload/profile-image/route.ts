// ABOUTME: API endpoint for uploading profile avatars and header images
// ABOUTME: Validates images and updates profile with new URLs

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { validateImageFile } from '@/lib/utils/image-upload'
import { handleApiError } from '@/lib/errors/error-handler'
import { ValidationError } from '@/lib/errors/app-error'
import { profileService } from '@/lib/services/profile-service'

/**
 * POST /api/upload/profile-image
 * Upload avatar or header image for user profile
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string // 'avatar' or 'header'

    // Validate
    if (!file) {
      throw new ValidationError('No file provided')
    }

    if (!type || !['avatar', 'header'].includes(type)) {
      throw new ValidationError('Invalid type. Must be "avatar" or "header"')
    }

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      throw new ValidationError(validation.error!)
    }

    // Determine bucket and filename
    const bucket = type === 'avatar' ? 'avatars' : 'headers'
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${user.id}/${type}.${extension}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true, // Replace existing file
      })

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filename)

    // Update profile with new URL
    const updateData =
      type === 'avatar' ? { avatar_url: publicUrl } : { header_url: publicUrl }

    await profileService.updateProfile(supabase, user.id, updateData)

    return NextResponse.json({
      data: {
        url: publicUrl,
        type,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
