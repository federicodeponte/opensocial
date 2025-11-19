// ABOUTME: AI-powered hashtag suggestions
// ABOUTME: Generate relevant, trending hashtags for posts

import { generateChatCompletion, DEFAULT_MODELS } from './openai-client'

export interface HashtagSuggestion {
  hashtag: string
  relevance: number // 0-100
  category: 'trending' | 'topical' | 'niche'
}

/**
 * Generate hashtag suggestions for post content
 */
export async function suggestHashtags(
  content: string,
  count = 5
): Promise<HashtagSuggestion[]> {
  const systemPrompt = `You are a social media expert that suggests relevant hashtags.
Generate hashtags that are:
- Relevant to the content
- Mix of popular and niche tags
- Properly formatted (#lowercase, no spaces)
- Actually used on social media

Categorize as:
- trending: Popular, widely used hashtags
- topical: Subject-specific hashtags
- niche: Specialized community hashtags`

  const userPrompt = `Suggest ${count} hashtags for this post:

"${content}"

Return ONLY a JSON array of objects with "hashtag", "relevance" (0-100), and "category" fields. Example:
[
  {"hashtag": "#tech", "relevance": 95, "category": "trending"},
  {"hashtag": "#coding", "relevance": 88, "category": "topical"},
  {"hashtag": "#webdev", "relevance": 75, "category": "niche"}
]`

  try {
    const response = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: DEFAULT_MODELS.hashtags,
        temperature: 0.7,
        maxTokens: 300,
      }
    )

    const responseContent = response.choices[0]?.message?.content || '[]'

    // Extract JSON from response
    const jsonMatch = responseContent.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No valid JSON array in response')
    }

    const hashtags: HashtagSuggestion[] = JSON.parse(jsonMatch[0])

    // Validate and format
    return hashtags
      .filter((tag) => tag.hashtag && tag.relevance != null && tag.category)
      .map((tag) => ({
        hashtag: tag.hashtag.startsWith('#') ? tag.hashtag : `#${tag.hashtag}`,
        relevance: Math.min(100, Math.max(0, tag.relevance)),
        category: tag.category,
      }))
      .slice(0, count)
  } catch (error) {
    console.error('Hashtag suggestion error:', error)

    // Return fallback generic hashtags
    return [
      { hashtag: '#social', relevance: 80, category: 'trending' },
      { hashtag: '#post', relevance: 70, category: 'topical' },
    ]
  }
}

/**
 * Extract existing hashtags from content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w]+/g
  const matches = content.match(hashtagRegex)
  return matches || []
}

/**
 * Suggest complementary hashtags (ones that don't already exist in content)
 */
export async function suggestComplementaryHashtags(
  content: string,
  count = 5
): Promise<HashtagSuggestion[]> {
  const existingHashtags = extractHashtags(content)
  const allSuggestions = await suggestHashtags(content, count + existingHashtags.length)

  // Filter out existing hashtags
  return allSuggestions
    .filter(
      (suggestion) =>
        !existingHashtags.some(
          (existing) => existing.toLowerCase() === suggestion.hashtag.toLowerCase()
        )
    )
    .slice(0, count)
}

/**
 * Suggest trending hashtags for a topic
 */
export async function suggestTrendingHashtags(topic: string): Promise<string[]> {
  const systemPrompt = `You are a social media trends expert. Suggest currently trending hashtags related to the topic.
Only suggest hashtags that are actually popular and widely used.`

  const userPrompt = `List 5 trending hashtags related to: "${topic}"

Return ONLY a JSON array of hashtag strings (with # prefix). Example:
["#tech", "#ai", "#innovation", "#future", "#trending"]`

  try {
    const response = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: DEFAULT_MODELS.hashtags,
        temperature: 0.5,
        maxTokens: 100,
      }
    )

    const content = response.choices[0]?.message?.content || '[]'

    // Extract JSON array
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No valid JSON array in response')
    }

    const hashtags: string[] = JSON.parse(jsonMatch[0])

    return hashtags
      .filter((tag) => typeof tag === 'string' && tag.length > 0)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .slice(0, 5)
  } catch (error) {
    console.error('Trending hashtag suggestion error:', error)
    return [`#${topic.toLowerCase().replace(/\s+/g, '')}`]
  }
}
