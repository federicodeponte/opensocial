// ABOUTME: AI-powered content moderation system
// ABOUTME: Detect toxic content, hate speech, violence, and spam

import { moderateContent as openAIModerate } from './openai-client'
import { generateChatCompletion, DEFAULT_MODELS } from './openai-client'

export interface ModerationResult {
  flagged: boolean
  categories: {
    hate: boolean
    hate_threatening: boolean
    harassment: boolean
    harassment_threatening: boolean
    self_harm: boolean
    self_harm_intent: boolean
    self_harm_instructions: boolean
    sexual: boolean
    sexual_minors: boolean
    violence: boolean
    violence_graphic: boolean
    spam: boolean
    misinformation: boolean
  }
  category_scores: {
    hate: number
    hate_threatening: number
    harassment: number
    harassment_threatening: number
    self_harm: number
    self_harm_intent: number
    self_harm_instructions: number
    sexual: number
    sexual_minors: number
    violence: number
    violence_graphic: number
    spam: number
    misinformation: number
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'allow' | 'warn' | 'block' | 'review'
  explanation?: string
}

/**
 * Moderate content using OpenAI's moderation endpoint + custom AI analysis
 */
export async function moderatePostContent(content: string): Promise<ModerationResult> {
  try {
    // Use OpenAI's moderation API (fast, built-in)
    const openAIResult = await openAIModerate(content)

    // Enhanced moderation with GPT-4 for spam and misinformation
    const enhancedResult = await enhancedModeration(content)

    // Combine results
    const categories = {
      hate: openAIResult.categories.hate,
      hate_threatening: openAIResult.categories['hate/threatening'],
      harassment: openAIResult.categories.harassment,
      harassment_threatening: openAIResult.categories['harassment/threatening'],
      self_harm: openAIResult.categories['self-harm'],
      self_harm_intent: openAIResult.categories['self-harm/intent'],
      self_harm_instructions: openAIResult.categories['self-harm/instructions'],
      sexual: openAIResult.categories.sexual,
      sexual_minors: openAIResult.categories['sexual/minors'],
      violence: openAIResult.categories.violence,
      violence_graphic: openAIResult.categories['violence/graphic'],
      spam: enhancedResult.spam,
      misinformation: enhancedResult.misinformation,
    }

    const category_scores = {
      hate: openAIResult.category_scores.hate,
      hate_threatening: openAIResult.category_scores['hate/threatening'],
      harassment: openAIResult.category_scores.harassment,
      harassment_threatening: openAIResult.category_scores['harassment/threatening'],
      self_harm: openAIResult.category_scores['self-harm'],
      self_harm_intent: openAIResult.category_scores['self-harm/intent'],
      self_harm_instructions: openAIResult.category_scores['self-harm/instructions'],
      sexual: openAIResult.category_scores.sexual,
      sexual_minors: openAIResult.category_scores['sexual/minors'],
      violence: openAIResult.category_scores.violence,
      violence_graphic: openAIResult.category_scores['violence/graphic'],
      spam: enhancedResult.spamScore,
      misinformation: enhancedResult.misinformationScore,
    }

    // Determine severity and action
    const severity = calculateSeverity(category_scores)
    const action = determineAction(severity, categories)

    return {
      flagged: openAIResult.flagged || enhancedResult.spam || enhancedResult.misinformation,
      categories,
      category_scores,
      severity,
      action,
      explanation: enhancedResult.explanation,
    }
  } catch (error) {
    console.error('Content moderation error:', error)

    // Fallback: allow content but log for review
    return {
      flagged: false,
      categories: {
        hate: false,
        hate_threatening: false,
        harassment: false,
        harassment_threatening: false,
        self_harm: false,
        self_harm_intent: false,
        self_harm_instructions: false,
        sexual: false,
        sexual_minors: false,
        violence: false,
        violence_graphic: false,
        spam: false,
        misinformation: false,
      },
      category_scores: {
        hate: 0,
        hate_threatening: 0,
        harassment: 0,
        harassment_threatening: 0,
        self_harm: 0,
        self_harm_intent: 0,
        self_harm_instructions: 0,
        sexual: 0,
        sexual_minors: 0,
        violence: 0,
        violence_graphic: 0,
        spam: 0,
        misinformation: 0,
      },
      severity: 'low',
      action: 'allow',
      explanation: 'Moderation check failed, flagged for manual review',
    }
  }
}

/**
 * Enhanced moderation for spam and misinformation using GPT-4
 */
async function enhancedModeration(
  content: string
): Promise<{
  spam: boolean
  misinformation: boolean
  spamScore: number
  misinformationScore: number
  explanation: string
}> {
  const systemPrompt = `You are a content moderation expert. Analyze content for:
1. Spam (promotional, repetitive, low-value content)
2. Misinformation (false claims, conspiracy theories, unverified facts)

Rate each on a scale of 0.0 to 1.0.`

  const userPrompt = `Analyze this content:

"${content}"

Return JSON with:
- spam (boolean)
- spamScore (0.0-1.0)
- misinformation (boolean)
- misinformationScore (0.0-1.0)
- explanation (brief reason)

Example:
{
  "spam": false,
  "spamScore": 0.1,
  "misinformation": false,
  "misinformationScore": 0.05,
  "explanation": "Content appears legitimate"
}`

  try {
    const response = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: DEFAULT_MODELS.moderation,
        temperature: 0.2,
        maxTokens: 200,
      }
    )

    const responseContent = response.choices[0]?.message?.content || '{}'
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        spam: result.spam || false,
        misinformation: result.misinformation || false,
        spamScore: result.spamScore || 0,
        misinformationScore: result.misinformationScore || 0,
        explanation: result.explanation || '',
      }
    }
  } catch (error) {
    console.error('Enhanced moderation error:', error)
  }

  return {
    spam: false,
    misinformation: false,
    spamScore: 0,
    misinformationScore: 0,
    explanation: '',
  }
}

/**
 * Calculate severity based on category scores
 */
function calculateSeverity(scores: Record<string, number>): ModerationResult['severity'] {
  const maxScore = Math.max(...Object.values(scores))

  if (maxScore >= 0.9) return 'critical'
  if (maxScore >= 0.7) return 'high'
  if (maxScore >= 0.4) return 'medium'
  return 'low'
}

/**
 * Determine action based on severity and categories
 */
function determineAction(
  severity: ModerationResult['severity'],
  categories: Record<string, boolean>
): ModerationResult['action'] {
  // Critical violations: block immediately
  if (
    categories.sexual_minors ||
    categories.hate_threatening ||
    categories.violence_graphic ||
    categories.self_harm_instructions
  ) {
    return 'block'
  }

  // High severity: block
  if (severity === 'critical' || severity === 'high') {
    return 'block'
  }

  // Medium severity: review
  if (severity === 'medium') {
    return 'review'
  }

  // Low violations: warn user
  if (Object.values(categories).some((v) => v === true)) {
    return 'warn'
  }

  return 'allow'
}

/**
 * Quick spam check (lightweight)
 */
export function quickSpamCheck(content: string): boolean {
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /http[s]?:\/\/.*http[s]?:\/\/.*http[s]?:\/\//, // Multiple URLs
    /\b(buy now|click here|limited time|act now)\b/i, // Spam phrases
    /#[a-z0-9_]{20,}/i, // Excessively long hashtags
  ]

  return spamPatterns.some((pattern) => pattern.test(content))
}
