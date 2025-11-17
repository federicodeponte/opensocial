// ABOUTME: Giphy API client for GIF search and retrieval
// ABOUTME: Provides wrapper around @giphy/js-fetch-api with type safety

import { GiphyFetch } from '@giphy/js-fetch-api'

// Giphy API key - Free tier: 42,000 requests/day
// Get your key at: https://developers.giphy.com/
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'demo' // Demo key for development

/**
 * Giphy client instance
 * Uses demo key if no API key is set (limited functionality)
 */
export const giphyClient = new GiphyFetch(GIPHY_API_KEY)

/**
 * Search GIFs with query
 * @param query - Search term
 * @param limit - Number of results (default 25)
 * @param offset - Pagination offset (default 0)
 */
export async function searchGifs(query: string, limit = 25, offset = 0) {
  try {
    const result = await giphyClient.search(query, { limit, offset, type: 'gifs' })
    return result
  } catch (error) {
    console.error('Error searching GIFs:', error)
    throw new Error('Failed to search GIFs')
  }
}

/**
 * Get trending GIFs
 * @param limit - Number of results (default 25)
 * @param offset - Pagination offset (default 0)
 */
export async function getTrendingGifs(limit = 25, offset = 0) {
  try {
    const result = await giphyClient.trending({ limit, offset, type: 'gifs' })
    return result
  } catch (error) {
    console.error('Error fetching trending GIFs:', error)
    throw new Error('Failed to fetch trending GIFs')
  }
}

/**
 * Get GIF by ID
 * @param id - Giphy GIF ID
 */
export async function getGifById(id: string) {
  try {
    const result = await giphyClient.gif(id)
    return result
  } catch (error) {
    console.error('Error fetching GIF:', error)
    throw new Error('Failed to fetch GIF')
  }
}

/**
 * Get random GIF (optional tag filter)
 * @param tag - Optional tag to filter random GIF
 */
export async function getRandomGif(tag?: string) {
  try {
    const result = await giphyClient.random({ tag, type: 'gifs' })
    return result
  } catch (error) {
    console.error('Error fetching random GIF:', error)
    throw new Error('Failed to fetch random GIF')
  }
}

/**
 * Extract GIF URL from Giphy GIF object
 * Returns optimized URL for web display
 */
export function getGifUrl(gif: any): string {
  // Use fixed_width for optimal size/quality balance
  return gif.images?.fixed_width?.url || gif.images?.original?.url || ''
}

/**
 * Extract GIF preview URL (smaller, for thumbnails)
 */
export function getGifPreviewUrl(gif: any): string {
  return gif.images?.fixed_width_small?.url || gif.images?.fixed_width?.url || ''
}

/**
 * Get GIF dimensions
 */
export function getGifDimensions(gif: any): { width: number; height: number } {
  const image = gif.images?.fixed_width || gif.images?.original
  return {
    width: parseInt(image?.width || '0'),
    height: parseInt(image?.height || '0'),
  }
}
