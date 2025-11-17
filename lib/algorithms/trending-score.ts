// ABOUTME: Trending score calculation algorithm for posts and hashtags
// ABOUTME: Uses engagement metrics with time decay to surface fresh, popular content

import { Post } from '@/lib/types/types'

/**
 * Calculates trending score for a post
 * Formula: (likes * 1.0 + retweets * 2.0 + replies * 1.5 + views * 0.01) / timeDecay
 */
export function calculateTrendingScore(post: {
  likes_count: number
  retweets_count: number
  replies_count: number
  views_count: number
  created_at: string
}): number {
  const now = new Date()
  const postDate = new Date(post.created_at)
  const hoursAgo = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)

  // Engagement score
  const engagementScore =
    post.likes_count * 1.0 +
    post.retweets_count * 2.0 +
    post.replies_count * 1.5 +
    post.views_count * 0.01

  // Time decay: posts lose relevance over time
  // Uses exponential decay with half-life of 6 hours
  const timeDecay = Math.pow(2, -hoursAgo / 6)

  return engagementScore * timeDecay
}

/**
 * Calculates trending score for a hashtag
 * Formula: (post_count * 10 + total_engagement) / timeDecay
 */
export function calculateHashtagTrendingScore(hashtag: {
  post_count: number
  total_likes: number
  total_retweets: number
  last_used_at: string
}): number {
  const now = new Date()
  const lastUsed = new Date(hashtag.last_used_at)
  const hoursAgo = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60)

  // Engagement score
  const engagementScore =
    hashtag.post_count * 10 + hashtag.total_likes + hashtag.total_retweets * 2

  // Time decay: hashtags lose relevance faster (4 hour half-life)
  const timeDecay = Math.pow(2, -hoursAgo / 4)

  return engagementScore * timeDecay
}

/**
 * Time windows for trending content
 */
export const TRENDING_WINDOWS = {
  NOW: 3, // Last 3 hours
  TODAY: 24, // Last 24 hours
  WEEK: 168, // Last 7 days
} as const

/**
 * Filters posts to a specific time window
 */
export function filterByTimeWindow(
  posts: Array<{ created_at: string }>,
  hours: number
): Array<{ created_at: string }> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
  return posts.filter((post) => new Date(post.created_at) >= cutoff)
}

/**
 * Sorts posts by trending score
 */
export function sortByTrendingScore<
  T extends {
    likes_count: number
    retweets_count: number
    replies_count: number
    views_count: number
    created_at: string
  }
>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const scoreA = calculateTrendingScore(a)
    const scoreB = calculateTrendingScore(b)
    return scoreB - scoreA
  })
}
