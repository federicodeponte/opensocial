// ABOUTME: Content parser for extracting hashtags, mentions, and URLs
// ABOUTME: Provides utilities for parsing and linking content in posts

export interface ParsedContent {
  hashtags: string[]
  mentions: string[]
  urls: string[]
}

/**
 * Extract hashtags from text
 * Matches #word but not #123 or # alone
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#([a-zA-Z]\w*)/g
  const matches = text.matchAll(hashtagRegex)
  const hashtags = Array.from(matches, match => match[1].toLowerCase())

  // Remove duplicates
  return Array.from(new Set(hashtags))
}

/**
 * Extract mentions from text
 * Matches @username
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const matches = text.matchAll(mentionRegex)
  const mentions = Array.from(matches, match => match[1].toLowerCase())

  // Remove duplicates
  return Array.from(new Set(mentions))
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = text.matchAll(urlRegex)
  const urls = Array.from(matches, match => match[1])

  // Remove duplicates
  return Array.from(new Set(urls))
}

/**
 * Parse all content from text
 */
export function parseContent(text: string): ParsedContent {
  return {
    hashtags: extractHashtags(text),
    mentions: extractMentions(text),
    urls: extractUrls(text),
  }
}

/**
 * Convert plain text to HTML with clickable hashtags, mentions, and links
 */
export function formatContentWithLinks(text: string): string {
  let formatted = text

  // Escape HTML to prevent XSS
  formatted = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // Convert URLs to links
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
  )

  // Convert hashtags to links
  formatted = formatted.replace(
    /#([a-zA-Z]\w*)/g,
    '<a href="/hashtag/$1" class="text-blue-600 hover:underline font-medium">#$1</a>'
  )

  // Convert mentions to links
  formatted = formatted.replace(
    /@(\w+)/g,
    '<a href="/$1" class="text-blue-600 hover:underline font-medium">@$1</a>'
  )

  return formatted
}

/**
 * Convert content to React-friendly segments
 * Returns array of text and link objects for rendering
 */
export interface ContentSegment {
  type: 'text' | 'hashtag' | 'mention' | 'url'
  content: string
  href?: string
}

export function parseContentToSegments(text: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  let currentIndex = 0

  // Combined regex to match all special content
  const combinedRegex = /(#[a-zA-Z]\w*|@\w+|https?:\/\/[^\s]+)/g
  const matches = Array.from(text.matchAll(combinedRegex))

  matches.forEach((match) => {
    const matchIndex = match.index!
    const matchText = match[0]

    // Add text before match
    if (matchIndex > currentIndex) {
      segments.push({
        type: 'text',
        content: text.slice(currentIndex, matchIndex),
      })
    }

    // Add the match
    if (matchText.startsWith('#')) {
      const tag = matchText.slice(1)
      segments.push({
        type: 'hashtag',
        content: matchText,
        href: `/hashtag/${tag}`,
      })
    } else if (matchText.startsWith('@')) {
      const username = matchText.slice(1)
      segments.push({
        type: 'mention',
        content: matchText,
        href: `/${username}`,
      })
    } else if (matchText.startsWith('http')) {
      segments.push({
        type: 'url',
        content: matchText,
        href: matchText,
      })
    }

    currentIndex = matchIndex + matchText.length
  })

  // Add remaining text
  if (currentIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(currentIndex),
    })
  }

  return segments
}
