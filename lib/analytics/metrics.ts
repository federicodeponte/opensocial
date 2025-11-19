// ABOUTME: Analytics metrics calculation utilities
// ABOUTME: Track impressions, engagement, reach, and demographics

export interface PostAnalytics {
  postId: string
  impressions: number
  engagements: number
  likes: number
  retweets: number
  replies: number
  clicks: number
  profileClicks: number
  engagementRate: number
  reach: number
  createdAt: string
}

export interface UserAnalytics {
  userId: string
  followers: number
  following: number
  posts: number
  totalImpressions: number
  totalEngagements: number
  avgEngagementRate: number
  followerGrowth: Array<{ date: string; count: number }>
  topPosts: PostAnalytics[]
}

export interface AudienceInsights {
  demographics: {
    topLocations: Array<{ location: string; count: number; percentage: number }>
    topInterests: Array<{ interest: string; count: number }>
    activeHours: Array<{ hour: number; count: number }>
    deviceTypes: { mobile: number; desktop: number; tablet: number }
  }
  engagement: {
    avgEngagementRate: number
    bestPostingTime: string
    topContentTypes: Array<{ type: string; engagement: number }>
  }
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(
  engagements: number,
  impressions: number
): number {
  if (impressions === 0) return 0
  return parseFloat(((engagements / impressions) * 100).toFixed(2))
}

/**
 * Calculate post reach (unique users who saw the post)
 */
export function calculateReach(
  impressions: number,
  followers: number
): number {
  // Estimate: reach is typically 10-30% of impressions for organic content
  const estimatedReach = Math.min(impressions * 0.3, followers * 1.5)
  return Math.round(estimatedReach)
}

/**
 * Get engagement breakdown
 */
export function getEngagementBreakdown(post: PostAnalytics): {
  likes: number
  retweets: number
  replies: number
  clicks: number
  total: number
} {
  return {
    likes: post.likes,
    retweets: post.retweets,
    replies: post.replies,
    clicks: post.clicks,
    total: post.likes + post.retweets + post.replies + post.clicks,
  }
}

/**
 * Calculate follower growth rate
 */
export function calculateFollowerGrowthRate(
  currentFollowers: number,
  previousFollowers: number
): number {
  if (previousFollowers === 0) return 0
  const growth = ((currentFollowers - previousFollowers) / previousFollowers) * 100
  return parseFloat(growth.toFixed(2))
}

/**
 * Get top performing posts
 */
export function getTopPosts(
  posts: PostAnalytics[],
  metric: 'impressions' | 'engagements' | 'engagementRate' = 'engagements',
  limit = 10
): PostAnalytics[] {
  return [...posts]
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, limit)
}

/**
 * Calculate average posting frequency
 */
export function calculatePostingFrequency(
  posts: PostAnalytics[],
  days = 30
): number {
  if (posts.length === 0) return 0

  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const recentPosts = posts.filter(
    (post) => new Date(post.createdAt) >= startDate
  )

  return parseFloat((recentPosts.length / days).toFixed(2))
}

/**
 * Get best posting time based on engagement
 */
export function getBestPostingTime(posts: PostAnalytics[]): string {
  const hourlyEngagement: Record<number, number> = {}

  posts.forEach((post) => {
    const hour = new Date(post.createdAt).getHours()
    hourlyEngagement[hour] = (hourlyEngagement[hour] || 0) + post.engagements
  })

  const bestHour = Object.entries(hourlyEngagement).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0]

  if (!bestHour) return 'Not enough data'

  const hour = parseInt(bestHour)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour

  return `${displayHour}:00 ${period}`
}

/**
 * Generate analytics summary
 */
export function generateAnalyticsSummary(analytics: UserAnalytics): {
  summary: string
  insights: string[]
  recommendations: string[]
} {
  const insights: string[] = []
  const recommendations: string[] = []

  // Engagement rate analysis
  if (analytics.avgEngagementRate > 5) {
    insights.push('🔥 Excellent engagement rate (above 5%)')
  } else if (analytics.avgEngagementRate > 2) {
    insights.push('✅ Good engagement rate (2-5%)')
  } else {
    insights.push('⚠️ Engagement rate could be improved')
    recommendations.push('Try posting more interactive content (polls, questions)')
  }

  // Posting consistency
  const postsPerDay = analytics.posts / 30
  if (postsPerDay < 1) {
    recommendations.push('Consider posting more frequently (aim for 1-3 posts/day)')
  }

  // Follower growth
  const recentGrowth = analytics.followerGrowth.slice(-7)
  const avgGrowth =
    recentGrowth.reduce((sum, day) => sum + day.count, 0) / recentGrowth.length

  if (avgGrowth > 10) {
    insights.push('📈 Strong follower growth')
  } else if (avgGrowth < 5) {
    recommendations.push('Engage more with your community to boost growth')
  }

  return {
    summary: `You have ${analytics.followers} followers with ${analytics.avgEngagementRate}% average engagement rate`,
    insights,
    recommendations,
  }
}
