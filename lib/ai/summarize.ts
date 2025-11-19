// ABOUTME: Content summarization using AI
// ABOUTME: Generate concise summaries of long posts and threads

import { generateChatCompletion, DEFAULT_MODELS } from './openai-client'

export interface PostSummary {
  summary: string
  keyPoints: string[]
  tone: 'informative' | 'opinion' | 'news' | 'discussion'
  length: 'short' | 'medium' | 'long'
}

/**
 * Summarize a single post
 */
export async function summarizePost(
  content: string,
  maxLength = 100
): Promise<string> {
  const systemPrompt = `You are a helpful assistant that creates concise summaries of social media posts.
Keep summaries clear, objective, and under ${maxLength} characters.`

  const userPrompt = `Summarize this post in ${maxLength} characters or less:

"${content}"

Return ONLY the summary text, no quotes or explanations.`

  try {
    const response = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: DEFAULT_MODELS.summarization,
        temperature: 0.3,
        maxTokens: 100,
      }
    )

    let summary = response.choices[0]?.message?.content || ''
    summary = summary.replace(/^["']|["']$/g, '').trim()

    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...'
    }

    return summary
  } catch (error) {
    console.error('Summarization error:', error)
    return content.substring(0, maxLength - 3) + '...'
  }
}

/**
 * Summarize a thread of posts with detailed analysis
 */
export async function summarizeThread(
  posts: Array<{ content: string; author?: string }>
): Promise<PostSummary> {
  const threadContent = posts
    .map((post, i) => `${i + 1}. ${post.author ? `@${post.author}: ` : ''}${post.content}`)
    .join('\n\n')

  const systemPrompt = `You are a helpful assistant that analyzes and summarizes discussion threads.
Provide a concise summary, extract 3-5 key points, and identify the tone and discussion length.`

  const userPrompt = `Analyze this thread:

${threadContent}

Return a JSON object with:
- summary (string, under 200 characters)
- keyPoints (array of 3-5 strings)
- tone (one of: informative, opinion, news, discussion)
- length (one of: short, medium, long based on content depth)

Example:
{
  "summary": "Discussion about AI impact on jobs...",
  "keyPoints": ["AI will change workforce", "Need for retraining", "Opportunity in new fields"],
  "tone": "discussion",
  "length": "medium"
}`

  try {
    const response = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: DEFAULT_MODELS.summarization,
        temperature: 0.3,
        maxTokens: 300,
      }
    )

    const content = response.choices[0]?.message?.content || '{}'

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON in response')
    }

    const summary: PostSummary = JSON.parse(jsonMatch[0])

    // Validate
    if (!summary.summary || !summary.keyPoints || !summary.tone || !summary.length) {
      throw new Error('Invalid summary structure')
    }

    return summary
  } catch (error) {
    console.error('Thread summarization error:', error)

    // Fallback summary
    const combinedText = posts.map((p) => p.content).join(' ')
    return {
      summary: combinedText.substring(0, 200) + '...',
      keyPoints: ['Thread discussion'],
      tone: 'discussion',
      length: posts.length > 10 ? 'long' : posts.length > 5 ? 'medium' : 'short',
    }
  }
}

/**
 * Generate TL;DR for long content
 */
export async function generateTLDR(content: string): Promise<string> {
  const systemPrompt = `You are a helpful assistant that creates "TL;DR" (Too Long; Didn't Read) summaries.
Make them punchy, engaging, and under 50 characters.`

  const userPrompt = `Create a TL;DR for this content:

"${content}"

Return ONLY the TL;DR text (under 50 characters), no prefix like "TL;DR:".`

  try {
    const response = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: DEFAULT_MODELS.summarization,
        temperature: 0.5,
        maxTokens: 50,
      }
    )

    let tldr = response.choices[0]?.message?.content || ''
    tldr = tldr.replace(/^["']|["']$/g, '').replace(/^TL;DR:?\s*/i, '').trim()

    if (tldr.length > 50) {
      tldr = tldr.substring(0, 47) + '...'
    }

    return tldr
  } catch (error) {
    console.error('TL;DR generation error:', error)
    return content.substring(0, 47) + '...'
  }
}
