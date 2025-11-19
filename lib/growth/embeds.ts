// ABOUTME: Embeddable widget generation for posts
// ABOUTME: Generate iframe embed codes for external sites

export interface EmbedOptions {
  theme?: 'light' | 'dark' | 'auto'
  maxWidth?: number
  showActions?: boolean
  showStats?: boolean
}

/**
 * Generate embed code for a post
 */
export function generatePostEmbed(
  postId: string,
  options: EmbedOptions = {}
): string {
  const {
    theme = 'auto',
    maxWidth = 550,
    showActions = true,
    showStats = true,
  } = options

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://opensocial.app'

  const params = new URLSearchParams({
    theme,
    actions: showActions.toString(),
    stats: showStats.toString(),
  })

  const embedUrl = `${baseUrl}/embed/post/${postId}?${params.toString()}`

  return `<iframe src="${embedUrl}" width="100%" height="auto" style="max-width: ${maxWidth}px; border: 1px solid #e5e7eb; border-radius: 12px;" frameborder="0" allowtransparency="true"></iframe>`
}

/**
 * Generate embed code for a profile
 */
export function generateProfileEmbed(
  username: string,
  options: EmbedOptions = {}
): string {
  const { theme = 'auto', maxWidth = 350 } = options

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://opensocial.app'

  const params = new URLSearchParams({ theme })

  const embedUrl = `${baseUrl}/embed/profile/${username}?${params.toString()}`

  return `<iframe src="${embedUrl}" width="100%" height="auto" style="max-width: ${maxWidth}px; border: 1px solid #e5e7eb; border-radius: 12px;" frameborder="0" allowtransparency="true"></iframe>`
}

/**
 * Generate JavaScript embed code (more interactive)
 */
export function generateScriptEmbed(postId: string): string {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://opensocial.app'

  return `<div id="opensocial-post-${postId}"></div>
<script async src="${baseUrl}/embed.js" data-post-id="${postId}"></script>`
}

/**
 * Generate WordPress shortcode
 */
export function generateWordPressShortcode(
  postId: string,
  options: EmbedOptions = {}
): string {
  const params = Object.entries(options)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ')

  return `[opensocial_post id="${postId}" ${params}]`
}

/**
 * Generate Medium embed code
 */
export function generateMediumEmbed(postId: string): string {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://opensocial.app'

  return `${baseUrl}/posts/${postId}`
}

/**
 * Generate oEmbed URL (for platforms that support it)
 */
export function generateOEmbedUrl(postId: string): string {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://opensocial.app'

  const postUrl = `${baseUrl}/posts/${postId}`
  return `${baseUrl}/oembed?url=${encodeURIComponent(postUrl)}&format=json`
}

/**
 * Copy embed code to clipboard
 */
export async function copyEmbedCode(embedCode: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(embedCode)
    return true
  } catch (error) {
    console.error('Failed to copy embed code:', error)
    return false
  }
}

/**
 * Get embed preview URL
 */
export function getEmbedPreviewUrl(postId: string, options: EmbedOptions = {}): string {
  const {
    theme = 'auto',
    showActions = true,
    showStats = true,
  } = options

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://opensocial.app'

  const params = new URLSearchParams({
    theme,
    actions: showActions.toString(),
    stats: showStats.toString(),
  })

  return `${baseUrl}/embed/post/${postId}?${params.toString()}`
}
