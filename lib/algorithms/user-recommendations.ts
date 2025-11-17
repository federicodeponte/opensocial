// ABOUTME: User recommendation algorithm for "Who to Follow" suggestions
// ABOUTME: Uses social graph analysis and user activity to suggest relevant users

export interface UserRecommendation {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
  followers_count: number
  reason: string // Why we're recommending this user
  score: number // Recommendation score
}

/**
 * Calculates recommendation score for a user
 */
export function calculateUserRecommendationScore(user: {
  followers_count: number
  posts_count: number
  mutual_follows_count: number
  last_post_hours_ago: number
  bio_similarity: number
}): number {
  let score = 0

  // Mutual connections (strongest signal)
  score += user.mutual_follows_count * 50

  // User activity (recent posts preferred)
  if (user.last_post_hours_ago < 24) {
    score += 30
  } else if (user.last_post_hours_ago < 168) {
    score += 15
  }

  // Follower count (but not too heavily weighted)
  score += Math.log10(Math.max(1, user.followers_count)) * 5

  // Bio similarity (shared interests)
  score += user.bio_similarity * 20

  // Post activity
  score += Math.min(user.posts_count / 10, 20)

  return score
}

/**
 * Generates reason text for why we're recommending a user
 */
export function getRecommendationReason(
  mutualFollowers: string[],
  bioSimilarity: number
): string {
  if (mutualFollowers.length > 0) {
    if (mutualFollowers.length === 1) {
      return `Followed by @${mutualFollowers[0]}`
    } else if (mutualFollowers.length === 2) {
      return `Followed by @${mutualFollowers[0]} and @${mutualFollowers[1]}`
    } else {
      return `Followed by @${mutualFollowers[0]}, @${mutualFollowers[1]} and ${mutualFollowers.length - 2} others`
    }
  }

  if (bioSimilarity > 0.7) {
    return 'Similar interests'
  }

  return 'Popular in your network'
}

/**
 * Calculate bio similarity score (0-1)
 * Simple keyword matching - can be enhanced with NLP
 */
export function calculateBioSimilarity(
  userBio: string | null,
  candidateBio: string | null
): number {
  if (!userBio || !candidateBio) return 0

  const userKeywords = extractKeywords(userBio)
  const candidateKeywords = extractKeywords(candidateBio)

  if (userKeywords.length === 0 || candidateKeywords.length === 0) return 0

  const intersection = userKeywords.filter((k) => candidateKeywords.includes(k))
  const union = new Set([...userKeywords, ...candidateKeywords])

  return intersection.length / union.size
}

/**
 * Extract keywords from bio text
 */
function extractKeywords(text: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'is',
    'was',
    'are',
    'were',
    'been',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'can',
    'i',
    'me',
    'my',
    'we',
    'our',
    'you',
    'your',
  ])

  return text
    .toLowerCase()
    .replace(/[^\w\s#@]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.has(word))
    .slice(0, 20) // Max 20 keywords
}
