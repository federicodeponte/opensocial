// ABOUTME: API endpoint for AI-powered content moderation
// ABOUTME: Detects toxic content, spam, hate speech, and violations

import { NextRequest, NextResponse } from 'next/server'
import { moderatePostContent, quickSpamCheck } from '@/lib/ai/content-moderation'
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
    const { content, quick = false } = body

    // Validation
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      )
    }

    if (content.length === 0) {
      return NextResponse.json(
        { error: 'content cannot be empty' },
        { status: 400 }
      )
    }

    // Quick spam check (no API call)
    if (quick) {
      const isSpam = quickSpamCheck(content)
      return NextResponse.json({
        flagged: isSpam,
        action: isSpam ? 'warn' : 'allow',
        quick: true,
      })
    }

    // Full moderation analysis
    const result = await moderatePostContent(content)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Moderation API error:', error)
    return NextResponse.json(
      { error: 'Failed to moderate content' },
      { status: 500 }
    )
  }
}
