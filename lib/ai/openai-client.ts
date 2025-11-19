// ABOUTME: OpenAI client configuration and utilities
// ABOUTME: Centralized OpenAI API integration with rate limiting and caching

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

/**
 * OpenAI client instance
 */
export { openai }

/**
 * Available OpenAI models
 */
export const MODELS = {
  GPT4_TURBO: 'gpt-4-turbo-preview',
  GPT4: 'gpt-4',
  GPT35_TURBO: 'gpt-3.5-turbo',
} as const

/**
 * Default model for different use cases
 */
export const DEFAULT_MODELS = {
  smartReply: MODELS.GPT35_TURBO, // Fast, cheap for simple replies
  summarization: MODELS.GPT35_TURBO, // Good for summaries
  moderation: MODELS.GPT4_TURBO, // Best accuracy for safety
  hashtags: MODELS.GPT35_TURBO, // Simple task
} as const

/**
 * Generate chat completion
 */
export async function generateChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
  } = {}
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const {
    model = MODELS.GPT35_TURBO,
    temperature = 0.7,
    maxTokens = 500,
  } = options

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false, // Always non-streaming
    })

    return response
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
}

/**
 * Generate single text completion
 */
export async function generateCompletion(
  prompt: string,
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
  } = {}
): Promise<string> {
  const response = await generateChatCompletion(
    [{ role: 'user', content: prompt }],
    options
  )

  return response.choices[0]?.message?.content || ''
}

/**
 * Use OpenAI moderation endpoint
 */
export async function moderateContent(content: string) {
  try {
    const response = await openai.moderations.create({
      input: content,
    })

    return response.results[0]
  } catch (error) {
    console.error('OpenAI moderation error:', error)
    throw error
  }
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}
