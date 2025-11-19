// ABOUTME: Content moderation utilities (FREE - no AI required)
// ABOUTME: Profanity filter, spam detection, and pattern matching

import Filter from 'bad-words'

// Initialize profanity filter
const filter = new Filter()

// Add custom words to filter (example - customize as needed)
filter.addWords('spam', 'scam')

// Spam patterns to detect
const SPAM_PATTERNS = [
  /click\s+here/gi,
  /buy\s+now/gi,
  /limited\s+time\s+offer/gi,
  /make\s+money\s+fast/gi,
  /work\s+from\s+home/gi,
  /\b(viagra|cialis)\b/gi,
  /\b(casino|poker)\b/gi,
  /bit\.ly|tinyurl\.com|goo\.gl/gi, // Shortened URLs often used for spam
  /(\w)\1{10,}/g, // Repeated characters (aaaaaaaaaa)
  /(.)\1{5,}/g, // Repeated patterns
]

// Excessive caps detection
const EXCESSIVE_CAPS_THRESHOLD = 0.6 // 60% or more caps is considered shouting

// Link spam detection
const MAX_LINKS_ALLOWED = 3

// Emoji spam detection
const MAX_EMOJIS_ALLOWED = 10

export interface ModerationResult {
  approved: boolean
  reasons: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  filteredContent?: string
  warnings: string[]
}

/**
 * Main content moderation function
 * Checks content against multiple filters
 */
export function moderateContent(content: string): ModerationResult {
  const reasons: string[] = []
  const warnings: string[] = []
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

  // 1. Check for profanity
  if (filter.isProfane(content)) {
    reasons.push('Contains profanity or inappropriate language')
    severity = 'high'
  }

  // 2. Check for spam patterns
  const spamPatternMatches = SPAM_PATTERNS.filter((pattern) =>
    pattern.test(content)
  )
  if (spamPatternMatches.length > 0) {
    reasons.push(`Matches spam patterns (${spamPatternMatches.length} detected)`)
    severity = severity === 'critical' ? 'critical' : 'high'
  }

  // 3. Check for excessive caps
  const capsPercentage = getCapitalizationPercentage(content)
  if (capsPercentage > EXCESSIVE_CAPS_THRESHOLD) {
    warnings.push('Excessive use of capital letters (shouting)')
    if (severity === 'low') severity = 'medium'
  }

  // 4. Check for link spam
  const linkCount = countLinks(content)
  if (linkCount > MAX_LINKS_ALLOWED) {
    reasons.push(`Too many links (${linkCount} found, max ${MAX_LINKS_ALLOWED})`)
    severity = 'high'
  }

  // 5. Check for emoji spam
  const emojiCount = countEmojis(content)
  if (emojiCount > MAX_EMOJIS_ALLOWED) {
    warnings.push(
      `Excessive emojis (${emojiCount} found, recommended max ${MAX_EMOJIS_ALLOWED})`
    )
    if (severity === 'low') severity = 'medium'
  }

  // 6. Check for repeated content (same message posted multiple times)
  const hasExcessiveRepetition = detectRepetition(content)
  if (hasExcessiveRepetition) {
    reasons.push('Contains excessive repetition')
    severity = 'medium'
  }

  // 7. Check content length
  if (content.length < 2) {
    warnings.push('Content too short to be meaningful')
  }

  // Determine approval
  const approved = reasons.length === 0

  return {
    approved,
    reasons,
    severity,
    filteredContent: approved ? content : filter.clean(content),
    warnings,
  }
}

/**
 * Clean content by removing profanity
 */
export function cleanContent(content: string): string {
  return filter.clean(content)
}

/**
 * Check if content contains profanity
 */
export function hasProfanity(content: string): boolean {
  return filter.isProfane(content)
}

/**
 * Calculate percentage of capitalized characters
 */
function getCapitalizationPercentage(content: string): number {
  const letters = content.replace(/[^a-zA-Z]/g, '')
  if (letters.length === 0) return 0

  const uppercase = content.replace(/[^A-Z]/g, '')
  return uppercase.length / letters.length
}

/**
 * Count number of links in content
 */
function countLinks(content: string): number {
  const urlPattern =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
  const matches = content.match(urlPattern)
  return matches ? matches.length : 0
}

/**
 * Count number of emojis in content
 */
function countEmojis(content: string): number {
  const emojiPattern =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
  const matches = content.match(emojiPattern)
  return matches ? matches.length : 0
}

/**
 * Detect excessive repetition in content
 */
function detectRepetition(content: string): boolean {
  // Check for repeated words
  const words = content.split(/\s+/)
  const wordCounts = new Map<string, number>()

  for (const word of words) {
    const normalized = word.toLowerCase()
    wordCounts.set(normalized, (wordCounts.get(normalized) || 0) + 1)
  }

  // If any word appears more than 30% of the time, it's repetitive
  const threshold = words.length * 0.3
  for (const count of wordCounts.values()) {
    if (count > threshold && count > 5) {
      return true
    }
  }

  return false
}

/**
 * Spam score calculation (0-100)
 * Higher score = more likely spam
 */
export function calculateSpamScore(content: string): number {
  let score = 0

  // Profanity: +30
  if (hasProfanity(content)) {
    score += 30
  }

  // Spam patterns: +15 per pattern
  const spamMatches = SPAM_PATTERNS.filter((pattern) => pattern.test(content))
  score += spamMatches.length * 15

  // Excessive caps: +20
  if (getCapitalizationPercentage(content) > EXCESSIVE_CAPS_THRESHOLD) {
    score += 20
  }

  // Too many links: +10 per extra link
  const linkCount = countLinks(content)
  if (linkCount > MAX_LINKS_ALLOWED) {
    score += (linkCount - MAX_LINKS_ALLOWED) * 10
  }

  // Too many emojis: +5
  if (countEmojis(content) > MAX_EMOJIS_ALLOWED) {
    score += 5
  }

  // Repetition: +25
  if (detectRepetition(content)) {
    score += 25
  }

  return Math.min(score, 100)
}

/**
 * Automated action based on moderation result
 */
export function getAutomatedAction(
  result: ModerationResult
): 'approve' | 'flag' | 'hide' | 'block' {
  if (result.approved) {
    return 'approve'
  }

  switch (result.severity) {
    case 'critical':
      return 'block' // Immediately block critical content
    case 'high':
      return 'hide' // Hide but allow manual review
    case 'medium':
      return 'flag' // Flag for review but still show
    case 'low':
    default:
      return 'flag'
  }
}

/**
 * Add custom words to filter
 */
export function addCustomWords(words: string[]) {
  filter.addWords(...words)
}

/**
 * Remove words from filter
 */
export function removeCustomWords(words: string[]) {
  filter.removeWords(...words)
}

/**
 * Check if content is likely a URL phishing attempt
 */
export function isPhishingAttempt(content: string): boolean {
  const suspiciousPatterns = [
    /verify.*account/gi,
    /suspended.*account/gi,
    /confirm.*identity/gi,
    /urgent.*action.*required/gi,
    /click.*immediately/gi,
    /account.*locked/gi,
    /unusual.*activity/gi,
  ]

  const hasLink = countLinks(content) > 0
  const hasSuspiciousPattern = suspiciousPatterns.some((pattern) =>
    pattern.test(content)
  )

  return hasLink && hasSuspiciousPattern
}

/**
 * Detect if content is a duplicate/near-duplicate
 * (Useful for preventing spam by checking against recent posts)
 */
export function calculateSimilarity(content1: string, content2: string): number {
  const normalize = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]/g, '')

  const normalized1 = normalize(content1)
  const normalized2 = normalize(content2)

  if (normalized1 === normalized2) return 1.0

  // Simple Levenshtein distance calculation
  const len1 = normalized1.length
  const len2 = normalized2.length

  if (len1 === 0 || len2 === 0) return 0

  // Create matrix
  const matrix: number[][] = []
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      const cost = normalized1[j - 1] === normalized2[i - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  const distance = matrix[len2][len1]
  const maxLen = Math.max(len1, len2)

  return 1 - distance / maxLen
}
