// ABOUTME: Achievement and badge system
// ABOUTME: Define achievements, check progress, award badges

// @ts-nocheck
import { createClient } from '@/lib/auth/supabase-client'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'engagement' | 'content' | 'social' | 'milestone'
  requirement: number
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  unlockedAt: string
  progress: number
}

export const ACHIEVEMENTS: Achievement[] = [
  // Engagement Achievements
  {
    id: 'first_post',
    name: 'First Steps',
    description: 'Create your first post',
    icon: '🎯',
    category: 'content',
    requirement: 1,
    points: 10,
    rarity: 'common',
  },
  {
    id: 'posts_10',
    name: 'Getting Started',
    description: 'Create 10 posts',
    icon: '📝',
    category: 'content',
    requirement: 10,
    points: 50,
    rarity: 'common',
  },
  {
    id: 'posts_100',
    name: 'Content Creator',
    description: 'Create 100 posts',
    icon: '✍️',
    category: 'content',
    requirement: 100,
    points: 500,
    rarity: 'rare',
  },
  {
    id: 'posts_1000',
    name: 'Prolific Writer',
    description: 'Create 1,000 posts',
    icon: '📚',
    category: 'content',
    requirement: 1000,
    points: 5000,
    rarity: 'legendary',
  },

  // Social Achievements
  {
    id: 'followers_10',
    name: 'Rising Star',
    description: 'Gain 10 followers',
    icon: '⭐',
    category: 'social',
    requirement: 10,
    points: 50,
    rarity: 'common',
  },
  {
    id: 'followers_100',
    name: 'Influencer',
    description: 'Gain 100 followers',
    icon: '🌟',
    category: 'social',
    requirement: 100,
    points: 500,
    rarity: 'rare',
  },
  {
    id: 'followers_1000',
    name: 'Celebrity',
    description: 'Gain 1,000 followers',
    icon: '💫',
    category: 'social',
    requirement: 1000,
    points: 5000,
    rarity: 'epic',
  },
  {
    id: 'followers_10000',
    name: 'Superstar',
    description: 'Gain 10,000 followers',
    icon: '🏆',
    category: 'social',
    requirement: 10000,
    points: 50000,
    rarity: 'legendary',
  },

  // Engagement Achievements
  {
    id: 'likes_100',
    name: 'Well Liked',
    description: 'Receive 100 likes',
    icon: '❤️',
    category: 'engagement',
    requirement: 100,
    points: 100,
    rarity: 'common',
  },
  {
    id: 'likes_1000',
    name: 'Fan Favorite',
    description: 'Receive 1,000 likes',
    icon: '💕',
    category: 'engagement',
    requirement: 1000,
    points: 1000,
    rarity: 'rare',
  },
  {
    id: 'viral_post',
    name: 'Viral Sensation',
    description: 'Get a post with 10,000 likes',
    icon: '🔥',
    category: 'engagement',
    requirement: 10000,
    points: 10000,
    rarity: 'legendary',
  },

  // Milestone Achievements
  {
    id: 'verified',
    name: 'Verified',
    description: 'Get verified status',
    icon: '✓',
    category: 'milestone',
    requirement: 1,
    points: 1000,
    rarity: 'epic',
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join in the first month',
    icon: '🚀',
    category: 'milestone',
    requirement: 1,
    points: 500,
    rarity: 'rare',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Post for 7 days in a row',
    icon: '🔥',
    category: 'engagement',
    requirement: 7,
    points: 100,
    rarity: 'common',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Post for 30 days in a row',
    icon: '💪',
    category: 'engagement',
    requirement: 30,
    points: 1000,
    rarity: 'epic',
  },
]

/**
 * Get user's achievements
 */
export async function getUserAchievements(
  userId: string
): Promise<UserAchievement[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error

  return (
    data?.map((a) => ({
      id: a.id,
      userId: a.user_id,
      achievementId: a.achievement_id,
      unlockedAt: a.unlocked_at,
      progress: a.progress,
    })) || []
  )
}

/**
 * Check if user has specific achievement
 */
export async function hasAchievement(
  userId: string,
  achievementId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single()

  return !!data
}

/**
 * Unlock achievement for user
 */
export async function unlockAchievement(
  userId: string,
  achievementId: string
): Promise<UserAchievement | null> {
  const supabase = createClient()

  // Check if already unlocked
  const alreadyHas = await hasAchievement(userId, achievementId)
  if (alreadyHas) return null

  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId)
  if (!achievement) return null

  const { data, error } = await supabase
    .from('user_achievements')
    .insert({
      user_id: userId,
      achievement_id: achievementId,
      progress: achievement.requirement,
      unlocked_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    userId: data.user_id,
    achievementId: data.achievement_id,
    unlockedAt: data.unlocked_at,
    progress: data.progress,
  }
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  userId: string,
  achievementId: string,
  progress: number
): Promise<void> {
  const supabase = createClient()

  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId)
  if (!achievement) return

  // Check if already exists
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id, progress')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single()

  if (existing) {
    // Update progress
    await supabase
      .from('user_achievements')
      .update({ progress })
      .eq('id', existing.id)

    // Auto-unlock if reached requirement
    if (progress >= achievement.requirement && existing.progress < achievement.requirement) {
      await supabase
        .from('user_achievements')
        .update({ unlocked_at: new Date().toISOString() })
        .eq('id', existing.id)
    }
  } else {
    // Create new progress entry
    await supabase.from('user_achievements').insert({
      user_id: userId,
      achievement_id: achievementId,
      progress,
      unlocked_at:
        progress >= achievement.requirement
          ? new Date().toISOString()
          : null,
    })
  }
}

/**
 * Calculate user's total achievement points
 */
export async function getUserAchievementPoints(userId: string): Promise<number> {
  const userAchievements = await getUserAchievements(userId)

  return userAchievements.reduce((total, ua) => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === ua.achievementId)
    return total + (achievement?.points || 0)
  }, 0)
}

/**
 * Get achievement progress percentage
 */
export function getAchievementProgress(
  achievement: Achievement,
  progress: number
): number {
  return Math.min(100, (progress / achievement.requirement) * 100)
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'text-gray-400'
    case 'rare':
      return 'text-blue-400'
    case 'epic':
      return 'text-purple-400'
    case 'legendary':
      return 'text-yellow-400'
  }
}
