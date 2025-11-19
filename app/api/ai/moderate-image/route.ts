// ABOUTME: API endpoint for AI-powered image moderation
// ABOUTME: Detects unsafe images using Vision AI

import { NextRequest, NextResponse } from 'next/server'
import { moderateImage, moderateImages, quickImageCheck } from '@/lib/ai/image-moderation'
import { isOpenAIConfigured } from '@/lib/ai/openai-client'

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI features are not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { imageUrl, imageUrls, quick = false } = body

    // Validation
    if (!imageUrl && !imageUrls) {
      return NextResponse.json(
        { error: 'imageUrl or imageUrls is required' },
        { status: 400 }
      )
    }

    // Quick check (no API call)
    if (quick && imageUrl) {
      const quickResult = quickImageCheck(imageUrl)
      return NextResponse.json({
        safe: !quickResult.suspicious,
        action: quickResult.suspicious ? 'block' : 'allow',
        explanation: quickResult.reason || 'Quick check passed',
        quick: true,
      })
    }

    // Batch moderation
    if (imageUrls && Array.isArray(imageUrls)) {
      if (imageUrls.length > 10) {
        return NextResponse.json(
          { error: 'Maximum 10 images per request' },
          { status: 400 }
        )
      }

      const results = await moderateImages(imageUrls)
      return NextResponse.json({ results })
    }

    // Single image moderation
    if (imageUrl) {
      const result = await moderateImage(imageUrl)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Image moderation API error:', error)
    return NextResponse.json(
      { error: 'Failed to moderate image' },
      { status: 500 }
    )
  }
}
