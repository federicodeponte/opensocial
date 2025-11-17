// ABOUTME: Utility functions for parsing and handling @mentions in post content
// ABOUTME: Extracts mentions, validates usernames, and creates linkable mention elements

/**
 * Regular expression to match @mentions in post content
 * Matches @username where username is alphanumeric + underscores
 */
const MENTION_REGEX = /@(\w+)/g

/**
 * Extract all @mentions from post content
 * @param content - The post content to parse
 * @returns Array of mentioned usernames (without the @ symbol)
 */
export function extractMentions(content: string): string[] {
  const matches = content.matchAll(MENTION_REGEX)
  const mentions = Array.from(matches, (match) => match[1])

  // Remove duplicates
  return Array.from(new Set(mentions))
}

/**
 * Replace @mentions with clickable links in post content
 * @param content - The post content with @mentions
 * @returns HTML string with mentions as links
 */
export function linkifyMentions(content: string): string {
  return content.replace(
    MENTION_REGEX,
    '<a href="/$1" class="text-blue-600 hover:underline font-semibold">@$1</a>'
  )
}

/**
 * Validate if a string is a valid username for mentions
 * @param username - The username to validate
 * @returns true if valid, false otherwise
 */
export function isValidMentionUsername(username: string): boolean {
  // Username must be 3-30 characters, alphanumeric + underscores only
  const usernameRegex = /^[\w]{3,30}$/
  return usernameRegex.test(username)
}

/**
 * Get mention suggestions based on partial input
 * Used for autocomplete functionality
 * @param partialUsername - The partial username being typed (without @)
 * @param maxSuggestions - Maximum number of suggestions to return
 * @returns Promise of matching usernames
 */
export async function getMentionSuggestions(
  partialUsername: string,
  maxSuggestions: number = 5
): Promise<Array<{ username: string; display_name: string | null; avatar_url: string | null }>> {
  if (!partialUsername || partialUsername.length < 2) {
    return []
  }

  try {
    const response = await fetch(
      `/api/search/users?q=${encodeURIComponent(partialUsername)}&limit=${maxSuggestions}`
    )

    if (!response.ok) {
      return []
    }

    const { data } = await response.json()
    return data || []
  } catch (error) {
    console.error('Failed to fetch mention suggestions:', error)
    return []
  }
}

/**
 * Count the number of mentions in content
 * @param content - The post content
 * @returns Number of unique mentions
 */
export function countMentions(content: string): number {
  return extractMentions(content).length
}
