// ABOUTME: Leaderboard system for top users
// ABOUTME: Rankings by followers, engagement, posts, points

// @ts-nocheck
import { createClient } from '@/lib/auth/supabase-client'

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  displayName: string
  avatarUrl?: string
  score: number
  change?: number // Position change from last period
}

export type LeaderboardType =
  | 'followers'
  | 'engagement'
  | 'posts'
  | 'points'
  | 'referrals'

/**
 * Get top users by followers
 */
export async function getFollowersLeaderboard(
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, follower_count')
    .order('follower_count', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (
    data?.map((profile, index) => ({
      rank: index + 1,
      userId: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      score: profile.follower_count || 0,
    })) || []
  )
}

/**
 * Get top users by post count
 */
export async function getPostsLeaderboard(
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  // Count posts per user
  const { data, error } = await supabase
    .from('posts')
    .select('author_id')
    .not('author_id', 'is', null)

  if (error) throw error

  // Group by author and count
  const postCounts = new Map<string, number>()
  data?.forEach((post) => {
    const count = postCounts.get(post.author_id) || 0
    postCounts.set(post.author_id, count + 1)
  })

  // Get top users
  const topUserIds = Array.from(postCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId]) => userId)

  if (topUserIds.length === 0) return []

  // Fetch user profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', topUserIds)

  return (
    topUserIds.map((userId, index) => {
      const profile = profiles?.find((p) => p.id === userId)
      return {
        rank: index + 1,
        userId,
        username: profile?.username || 'unknown',
        displayName: profile?.display_name || 'Unknown',
        avatarUrl: profile?.avatar_url,
        score: postCounts.get(userId) || 0,
      }
    }) || []
  )
}

/**
 * Get top users by engagement (likes + comments)
 */
export async function getEngagementLeaderboard(
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  // This is a simplified version - in production you'd want a materialized view
  const { data: posts, error } = await supabase
    .from('posts')
    .select('author_id, like_count, reply_count')
    .not('author_id', 'is', null)

  if (error) throw error

  // Calculate total engagement per user
  const engagementScores = new Map<string, number>()
  posts?.forEach((post) => {
    const current = engagementScores.get(post.author_id) || 0
    const engagement = (post.like_count || 0) + (post.reply_count || 0)
    engagementScores.set(post.author_id, current + engagement)
  })

  // Get top users
  const topUserIds = Array.from(engagementScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId]) => userId)

  if (topUserIds.length === 0) return []

  // Fetch user profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', topUserIds)

  return (
    topUserIds.map((userId, index) => {
      const profile = profiles?.find((p) => p.id === userId)
      return {
        rank: index + 1,
        userId,
        username: profile?.username || 'unknown',
        displayName: profile?.display_name || 'Unknown',
        avatarUrl: profile?.avatar_url,
        score: engagementScores.get(userId) || 0,
      }
    }) || []
  )
}

/**
 * Get top users by achievement points
 */
export async function getPointsLeaderboard(
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, achievement_points')
    .order('achievement_points', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (
    data?.map((profile, index) => ({
      rank: index + 1,
      userId: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      score: profile.achievement_points || 0,
    })) || []
  )
}

/**
 * Get leaderboard by type
 */
export async function getLeaderboard(
  type: LeaderboardType,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  switch (type) {
    case 'followers':
      return getFollowersLeaderboard(limit)
    case 'posts':
      return getPostsLeaderboard(limit)
    case 'engagement':
      return getEngagementLeaderboard(limit)
    case 'points':
      return getPointsLeaderboard(limit)
    case 'referrals':
      // Import from referrals module
      const { getTopReferrers } = await import('./referrals')
      return getTopReferrers(limit).then((data) =>
        data.map((item) => ({
          rank: item.rank,
          userId: item.profile.id,
          username: item.profile.username,
          displayName: item.profile.display_name,
          avatarUrl: item.profile.avatar_url,
          score: item.referrals,
        }))
      )
    default:
      return []
  }
}

/**
 * Get user's rank in specific leaderboard
 */
export async function getUserRank(
  userId: string,
  type: LeaderboardType
): Promise<number | null> {
  const leaderboard = await getLeaderboard(type, 1000) // Get top 1000

  const entry = leaderboard.find((e) => e.userId === userId)
  return entry ? entry.rank : null
}

/**
 * Get leaderboard title and description
 */
export function getLeaderboardInfo(type: LeaderboardType): {
  title: string
  description: string
  icon: string
} {
  switch (type) {
    case 'followers':
      return {
        title: 'Top Influencers',
        description: 'Users with the most followers',
        icon: '👥',
      }
    case 'posts':
      return {
        title: 'Top Creators',
        description: 'Users with the most posts',
        icon: '📝',
      }
    case 'engagement':
      return {
        title: 'Most Engaging',
        description: 'Users with the highest engagement',
        icon: '🔥',
      }
    case 'points':
      return {
        title: 'Top Achievers',
        description: 'Users with the most achievement points',
        icon: '🏆',
      }
    case 'referrals':
      return {
        title: 'Top Referrers',
        description: 'Users who brought the most people',
        icon: '🎯',
      }
  }
}
