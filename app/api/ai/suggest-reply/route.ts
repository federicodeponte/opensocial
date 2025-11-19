// ABOUTME: API endpoint for AI-powered reply suggestions
// ABOUTME: Returns 3 contextual reply options for any post

import { NextRequest, NextResponse } from 'next/server'
import { generateSmartReplies, generateCustomReply } from '@/lib/ai/smart-replies'
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
    const { postContent, authorName, previousReplies, customStyle } = body

    // Validation
    if (!postContent || typeof postContent !== 'string') {
      return NextResponse.json(
        { error: 'postContent is required and must be a string' },
        { status: 400 }
      )
    }

    if (postContent.length > 2000) {
      return NextResponse.json(
        { error: 'postContent is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Generate custom reply if style is provided
    if (customStyle) {
      const customReply = await generateCustomReply(postContent, customStyle)
      return NextResponse.json({
        customReply,
      })
    }

    // Generate smart reply suggestions
    const replies = await generateSmartReplies(postContent, {
      authorName,
      previousReplies,
    })

    return NextResponse.json({
      replies,
      cached: false,
    })
  } catch (error) {
    console.error('Smart reply API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate reply suggestions' },
      { status: 500 }
    )
  }
}
