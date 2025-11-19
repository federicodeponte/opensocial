// ABOUTME: Smart reply suggestions using AI
// ABOUTME: Generate contextual reply suggestions for posts

import { generateChatCompletion, DEFAULT_MODELS } from './openai-client'

export interface SmartReply {
  text: string
  tone: 'friendly' | 'professional' | 'funny' | 'supportive'
}

/**
 * Generate smart reply suggestions for a post
 */
export async function generateSmartReplies(
  postContent: string,
  context?: {
    authorName?: string
    previousReplies?: string[]
  }
): Promise<SmartReply[]> {
  const systemPrompt = `You are a helpful assistant that generates thoughtful, engaging reply suggestions for social media posts.
Generate 3 different replies with different tones: friendly, professional, and funny/supportive.
Keep replies concise (under 280 characters each).
Make replies feel natural and human-like, not robotic.`

  const userPrompt = `Generate 3 reply suggestions for this post${context?.authorName ? ` by ${context.authorName}` : ''}:

"${postContent}"

${context?.previousReplies && context.previousReplies.length > 0 ? `
Previous replies to consider:
${context.previousReplies.join('\n')}
` : ''}

Return ONLY a JSON array of objects with "text" and "tone" fields. Example:
[
  {"text": "Great post! I totally agree with...", "tone": "friendly"},
  {"text": "This is an interesting perspective...", "tone": "professional"},
  {"text": "Haha, this made my day!", "tone": "funny"}
]`

  try {
    const response = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: DEFAULT_MODELS.smartReply,
        temperature: 0.8,
        maxTokens: 300,
      }
    )

    const content = response.choices[0]?.message?.content || '[]'

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No valid JSON array in response')
    }

    const replies: SmartReply[] = JSON.parse(jsonMatch[0])

    // Validate and limit replies
    return replies
      .filter((reply) => reply.text && reply.tone)
      .slice(0, 3)
  } catch (error) {
    console.error('Smart replies generation error:', error)
    // Return fallback replies
    return [
      { text: 'Thanks for sharing!', tone: 'friendly' },
      { text: 'Interesting perspective.', tone: 'professional' },
      { text: 'Love this!', tone: 'supportive' },
    ]
  }
}

/**
 * Generate a custom reply based on user's style
 */
export async function generateCustomReply(
  postContent: string,
  userStyle: string,
  maxLength = 280
): Promise<string> {
  const systemPrompt = `You are a helpful assistant that generates replies matching the user's writing style.`

  const userPrompt = `Write a reply to this post in this style: "${userStyle}"

Post: "${postContent}"

Keep it under ${maxLength} characters and make it feel natural.
Return ONLY the reply text, no quotes or explanations.`

  try {
    const response = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: DEFAULT_MODELS.smartReply,
        temperature: 0.9,
        maxTokens: 100,
      }
    )

    let reply = response.choices[0]?.message?.content || ''

    // Remove quotes if present
    reply = reply.replace(/^["']|["']$/g, '').trim()

    // Truncate if too long
    if (reply.length > maxLength) {
      reply = reply.substring(0, maxLength - 3) + '...'
    }

    return reply
  } catch (error) {
    console.error('Custom reply generation error:', error)
    return ''
  }
}
