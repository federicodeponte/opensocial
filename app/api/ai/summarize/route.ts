// ABOUTME: API endpoint for AI-powered content summarization
// ABOUTME: Summarizes posts and threads with key points analysis

import { NextRequest, NextResponse } from 'next/server'
import { summarizePost, summarizeThread, generateTLDR } from '@/lib/ai/summarize'
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
    const { content, posts, type = 'post', maxLength = 100 } = body

    // Type: single post
    if (type === 'post' && content) {
      if (typeof content !== 'string' || content.length === 0) {
        return NextResponse.json(
          { error: 'content must be a non-empty string' },
          { status: 400 }
        )
      }

      const summary = await summarizePost(content, maxLength)
      return NextResponse.json({ summary })
    }

    // Type: TL;DR
    if (type === 'tldr' && content) {
      const tldr = await generateTLDR(content)
      return NextResponse.json({ tldr })
    }

    // Type: thread
    if (type === 'thread' && posts) {
      if (!Array.isArray(posts) || posts.length === 0) {
        return NextResponse.json(
          { error: 'posts must be a non-empty array' },
          { status: 400 }
        )
      }

      const threadSummary = await summarizeThread(posts)
      return NextResponse.json(threadSummary)
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide content or posts with appropriate type.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Summarization API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
