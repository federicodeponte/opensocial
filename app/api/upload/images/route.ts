// ABOUTME: API endpoint for uploading post images to Supabase Storage
// ABOUTME: Validates images and returns public URLs for use in posts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { validateImageFile, MAX_IMAGES_PER_POST } from '@/lib/utils/image-upload'
import { handleApiError } from '@/lib/errors/error-handler'
import { ValidationError } from '@/lib/errors/app-error'

/**
 * POST /api/upload/images
 * Upload images for a post (up to 4 images)
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
    const postId = formData.get('postId') as string
    const files: File[] = []

    // Collect all files
    for (let i = 0; i < MAX_IMAGES_PER_POST; i++) {
      const file = formData.get(`image${i}`) as File | null
      if (file) {
        files.push(file)
      }
    }

    // Validate
    if (files.length === 0) {
      throw new ValidationError('No images provided')
    }

    if (files.length > MAX_IMAGES_PER_POST) {
      throw new ValidationError(`Maximum ${MAX_IMAGES_PER_POST} images allowed per post`)
    }

    if (!postId) {
      throw new ValidationError('Post ID is required')
    }

    // Validate all files before uploading
    for (const file of files) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        throw new ValidationError(validation.error!)
      }
    }

    // Upload all images
    const imageUrls: string[] = []

    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      const extension = file.name.split('.').pop() || 'jpg'
      const filePath = `${user.id}/${postId}/${index}.${extension}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`)
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('post-images').getPublicUrl(filePath)

      imageUrls.push(publicUrl)
    }

    return NextResponse.json({
      data: {
        imageUrls,
        count: imageUrls.length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
