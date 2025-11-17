// ABOUTME: Utility functions for extracting and parsing link previews from URLs
// ABOUTME: Fetches Open Graph metadata and generates preview cards

import * as cheerio from 'cheerio'

export interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  favicon: string | null
}

/**
 * Extract all URLs from text content
 * @param content - Text to extract URLs from
 * @returns Array of URLs found in text
 */
export function extractUrls(content: string): string[] {
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = content.match(urlRegex) || []

  // Remove duplicates and clean up URLs
  return Array.from(new Set(matches.map(url => {
    // Remove trailing punctuation
    return url.replace(/[.,;:!?)\]}>]+$/, '')
  })))
}

/**
 * Fetch and parse link preview metadata from URL
 * @param url - URL to fetch preview for
 * @returns Link preview metadata
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  try {
    // Fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OpenSocial/1.0; +https://opensocial.app)',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract Open Graph metadata
    const ogTitle = $('meta[property="og:title"]').attr('content')
    const ogDescription = $('meta[property="og:description"]').attr('content')
    const ogImage = $('meta[property="og:image"]').attr('content')
    const ogSiteName = $('meta[property="og:site_name"]').attr('content')

    // Fallback to Twitter Card metadata
    const twitterTitle = $('meta[name="twitter:title"]').attr('content')
    const twitterDescription = $('meta[name="twitter:description"]').attr('content')
    const twitterImage = $('meta[name="twitter:image"]').attr('content')

    // Fallback to standard HTML meta tags
    const htmlTitle = $('title').text()
    const htmlDescription = $('meta[name="description"]').attr('content')
    const favicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      new URL(url).origin + '/favicon.ico'

    // Resolve relative URLs to absolute
    const resolveUrl = (relativeUrl: string | undefined) => {
      if (!relativeUrl) return null
      try {
        return new URL(relativeUrl, url).toString()
      } catch {
        return relativeUrl
      }
    }

    return {
      url,
      title: ogTitle || twitterTitle || htmlTitle || null,
      description: ogDescription || twitterDescription || htmlDescription || null,
      image: resolveUrl(ogImage || twitterImage),
      siteName: ogSiteName || new URL(url).hostname,
      favicon: resolveUrl(favicon),
    }
  } catch (error) {
    console.error('Error fetching link preview:', error)

    // Return basic preview with just URL info
    try {
      const urlObj = new URL(url)
      return {
        url,
        title: urlObj.hostname,
        description: null,
        image: null,
        siteName: urlObj.hostname,
        favicon: urlObj.origin + '/favicon.ico',
      }
    } catch {
      return {
        url,
        title: url,
        description: null,
        image: null,
        siteName: null,
        favicon: null,
      }
    }
  }
}

/**
 * Check if URL is from an image hosting service
 * @param url - URL to check
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const lowerUrl = url.toLowerCase()
  return imageExtensions.some(ext => lowerUrl.includes(ext))
}

/**
 * Check if URL is from a known social media platform
 * @param url - URL to check
 */
export function isSocialMediaUrl(url: string): boolean {
  const socialDomains = [
    'twitter.com',
    'x.com',
    'facebook.com',
    'instagram.com',
    'youtube.com',
    'tiktok.com',
    'linkedin.com',
  ]

  try {
    const hostname = new URL(url).hostname
    return socialDomains.some(domain => hostname.includes(domain))
  } catch {
    return false
  }
}
