// ABOUTME: Social media sharing utilities
// ABOUTME: Share to Twitter, Facebook, LinkedIn, copy link

export interface ShareData {
  title: string
  text: string
  url: string
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(data: ShareData): void {
  const text = encodeURIComponent(`${data.text}\n\n${data.url}`)
  const url = `https://twitter.com/intent/tweet?text=${text}`
  window.open(url, '_blank', 'width=550,height=420')
}

/**
 * Share to Facebook
 */
export function shareToFacebook(url: string): void {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  window.open(shareUrl, '_blank', 'width=550,height=420')
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn(data: ShareData): void {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`
  window.open(url, '_blank', 'width=550,height=420')
}

/**
 * Share to WhatsApp
 */
export function shareToWhatsApp(data: ShareData): void {
  const text = encodeURIComponent(`${data.text}\n\n${data.url}`)
  const url = `https://wa.me/?text=${text}`
  window.open(url, '_blank', 'width=550,height=420')
}

/**
 * Share to Reddit
 */
export function shareToReddit(data: ShareData): void {
  const url = `https://reddit.com/submit?url=${encodeURIComponent(data.url)}&title=${encodeURIComponent(data.title)}`
  window.open(url, '_blank', 'width=550,height=420')
}

/**
 * Copy link to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Use native Web Share API if available
 */
export async function nativeShare(data: ShareData): Promise<boolean> {
  if (!navigator.share) {
    return false
  }

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    })
    return true
  } catch (error) {
    // User cancelled or error occurred
    console.error('Native share failed:', error)
    return false
  }
}

/**
 * Generate share text for a post
 */
export function generatePostShareText(
  content: string,
  authorName: string,
  maxLength: number = 280
): string {
  const prefix = `Check out this post from @${authorName}: `
  const maxContentLength = maxLength - prefix.length - 30 // Reserve space for URL

  let shareContent = content
  if (shareContent.length > maxContentLength) {
    shareContent = shareContent.substring(0, maxContentLength - 3) + '...'
  }

  return `${prefix}${shareContent}`
}

/**
 * Generate share URL for a post
 */
export function generatePostShareUrl(postId: string): string {
  if (typeof window === 'undefined') {
    return `https://opensocial.app/posts/${postId}`
  }
  return `${window.location.origin}/posts/${postId}`
}

/**
 * Generate share URL for a profile
 */
export function generateProfileShareUrl(username: string): string {
  if (typeof window === 'undefined') {
    return `https://opensocial.app/${username}`
  }
  return `${window.location.origin}/${username}`
}

/**
 * Track share event (for analytics)
 */
export function trackShareEvent(
  platform: string,
  contentType: 'post' | 'profile',
  contentId: string
): void {
  // This can be connected to your analytics system
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'share', {
      method: platform,
      content_type: contentType,
      content_id: contentId,
    })
  }

  console.log('Share event:', { platform, contentType, contentId })
}
