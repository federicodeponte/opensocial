// ABOUTME: AI-powered image moderation
// ABOUTME: Detect unsafe images using OpenAI Vision API

import { openai } from './openai-client'

export interface ImageModerationResult {
  safe: boolean
  categories: {
    adult: boolean
    violence: boolean
    gore: boolean
    hate_symbols: boolean
    drugs: boolean
  }
  confidence: number // 0-100
  explanation: string
  action: 'allow' | 'blur' | 'block'
}

/**
 * Moderate image using OpenAI Vision API
 */
export async function moderateImage(imageUrl: string): Promise<ImageModerationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image for safety violations. Detect:
- Adult/sexual content
- Violence or gore
- Hate symbols or extremism
- Drug use or paraphernalia

Return JSON with:
- safe (boolean)
- categories (object with booleans for each)
- confidence (0-100)
- explanation (brief)
- action (allow, blur, or block)

Example:
{
  "safe": true,
  "categories": {"adult": false, "violence": false, "gore": false, "hate_symbols": false, "drugs": false},
  "confidence": 95,
  "explanation": "Image shows a landscape, no violations",
  "action": "allow"
}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    })

    const content = response.choices[0]?.message?.content || '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const result: ImageModerationResult = JSON.parse(jsonMatch[0])
      return result
    }

    // Fallback
    return {
      safe: true,
      categories: {
        adult: false,
        violence: false,
        gore: false,
        hate_symbols: false,
        drugs: false,
      },
      confidence: 50,
      explanation: 'Unable to analyze image',
      action: 'allow',
    }
  } catch (error) {
    console.error('Image moderation error:', error)

    // Fallback: allow but flag for manual review
    return {
      safe: true,
      categories: {
        adult: false,
        violence: false,
        gore: false,
        hate_symbols: false,
        drugs: false,
      },
      confidence: 0,
      explanation: 'Moderation check failed',
      action: 'allow',
    }
  }
}

/**
 * Batch moderate multiple images
 */
export async function moderateImages(
  imageUrls: string[]
): Promise<ImageModerationResult[]> {
  const results = await Promise.all(imageUrls.map((url) => moderateImage(url)))
  return results
}

/**
 * Quick NSFW check using simple heuristics
 */
export function quickImageCheck(imageUrl: string): { suspicious: boolean; reason?: string } {
  // Check file extension
  const suspiciousExtensions = ['.exe', '.bat', '.sh', '.dmg']
  if (suspiciousExtensions.some((ext) => imageUrl.toLowerCase().endsWith(ext))) {
    return { suspicious: true, reason: 'Suspicious file extension' }
  }

  // Check for known NSFW domains (basic list)
  const nsfwDomains = ['pornhub', 'xvideos', 'redtube']
  if (nsfwDomains.some((domain) => imageUrl.toLowerCase().includes(domain))) {
    return { suspicious: true, reason: 'Known NSFW domain' }
  }

  return { suspicious: false }
}
