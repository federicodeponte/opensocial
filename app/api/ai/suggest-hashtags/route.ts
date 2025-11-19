// ABOUTME: API endpoint for AI-powered hashtag suggestions
// ABOUTME: Returns relevant hashtags based on post content

import { NextRequest, NextResponse } from 'next/server'
import {
  suggestHashtags,
  suggestComplementaryHashtags,
  suggestTrendingHashtags,
} from '@/lib/ai/hashtag-suggestions'
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
    const { content, topic, count = 5, type = 'default' } = body

    // Validation
    if (type === 'trending' && topic) {
      const hashtags = await suggestTrendingHashtags(topic)
      return NextResponse.json({ hashtags })
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'content is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Generate suggestions
    const suggestions =
      type === 'complementary'
        ? await suggestComplementaryHashtags(content, count)
        : await suggestHashtags(content, count)

    return NextResponse.json({
      suggestions,
    })
  } catch (error) {
    console.error('Hashtag suggestion API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate hashtag suggestions' },
      { status: 500 }
    )
  }
}
