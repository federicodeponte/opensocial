// ABOUTME: Streaks and daily challenges system
// ABOUTME: Track consecutive days, daily goals, challenges

// @ts-nocheck
import { createClient } from '@/lib/auth/supabase-client'

export interface Streak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastActivityDate: string
}

export interface DailyChallenge {
  id: string
  name: string
  description: string
  icon: string
  goal: number
  points: number
  type: 'post' | 'like' | 'comment' | 'follow' | 'share'
}

export interface UserChallenge {
  id: string
  userId: string
  challengeId: string
  date: string
  progress: number
  completed: boolean
  completedAt?: string
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'daily_post',
    name: 'Daily Creator',
    description: 'Create 1 post today',
    icon: '📝',
    goal: 1,
    points: 10,
    type: 'post',
  },
  {
    id: 'daily_engage',
    name: 'Engagement Pro',
    description: 'Like 10 posts today',
    icon: '❤️',
    goal: 10,
    points: 5,
    type: 'like',
  },
  {
    id: 'daily_comment',
    name: 'Conversationalist',
    description: 'Reply to 5 posts today',
    icon: '💬',
    goal: 5,
    points: 10,
    type: 'comment',
  },
  {
    id: 'daily_follow',
    name: 'Community Builder',
    description: 'Follow 3 new people today',
    icon: '👥',
    goal: 3,
    points: 5,
    type: 'follow',
  },
  {
    id: 'daily_share',
    name: 'Viral Marketer',
    description: 'Share 2 posts today',
    icon: '🔄',
    goal: 2,
    points: 10,
    type: 'share',
  },
]

/**
 * Get user's current streak
 */
export async function getUserStreak(userId: string): Promise<Streak> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString().split('T')[0],
    }
  }

  return {
    userId: data.user_id,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastActivityDate: data.last_activity_date,
  }
}

/**
 * Update user's streak
 */
export async function updateStreak(userId: string): Promise<Streak> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const streak = await getUserStreak(userId)

  // Parse last activity date
  const lastDate = new Date(streak.lastActivityDate)
  const todayDate = new Date(today)
  const daysDiff = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  let newCurrentStreak = streak.currentStreak
  let newLongestStreak = streak.longestStreak

  if (daysDiff === 0) {
    // Same day, no change
    return streak
  } else if (daysDiff === 1) {
    // Consecutive day, increment streak
    newCurrentStreak += 1
    newLongestStreak = Math.max(newLongestStreak, newCurrentStreak)
  } else {
    // Streak broken, reset to 1
    newCurrentStreak = 1
  }

  // Upsert streak data
  const { data, error } = await supabase
    .from('user_streaks')
    .upsert(
      {
        user_id: userId,
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw error

  return {
    userId: data.user_id,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastActivityDate: data.last_activity_date,
  }
}

/**
 * Get today's challenges for user
 */
export async function getTodayChallenges(
  userId: string
): Promise<UserChallenge[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)

  if (error) throw error

  // If no challenges for today, create them
  if (!data || data.length === 0) {
    return await initializeTodayChallenges(userId)
  }

  return data.map((c) => ({
    id: c.id,
    userId: c.user_id,
    challengeId: c.challenge_id,
    date: c.date,
    progress: c.progress,
    completed: c.completed,
    completedAt: c.completed_at,
  }))
}

/**
 * Initialize today's challenges for user
 */
async function initializeTodayChallenges(
  userId: string
): Promise<UserChallenge[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const challenges = DAILY_CHALLENGES.map((challenge) => ({
    user_id: userId,
    challenge_id: challenge.id,
    date: today,
    progress: 0,
    completed: false,
  }))

  const { data, error } = await supabase
    .from('user_challenges')
    .insert(challenges)
    .select()

  if (error) throw error

  return (
    data?.map((c) => ({
      id: c.id,
      userId: c.user_id,
      challengeId: c.challenge_id,
      date: c.date,
      progress: c.progress,
      completed: c.completed,
      completedAt: c.completed_at,
    })) || []
  )
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  userId: string,
  challengeType: DailyChallenge['type'],
  increment: number = 1
): Promise<void> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Find challenge for this type
  const challenge = DAILY_CHALLENGES.find((c) => c.type === challengeType)
  if (!challenge) return

  // Get user's challenge for today
  const { data: userChallenge } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challenge.id)
    .eq('date', today)
    .single()

  if (!userChallenge) {
    // Create if doesn't exist
    await supabase.from('user_challenges').insert({
      user_id: userId,
      challenge_id: challenge.id,
      date: today,
      progress: increment,
      completed: increment >= challenge.goal,
      completed_at:
        increment >= challenge.goal ? new Date().toISOString() : null,
    })
  } else {
    // Update progress
    const newProgress = userChallenge.progress + increment
    await supabase
      .from('user_challenges')
      .update({
        progress: newProgress,
        completed: newProgress >= challenge.goal,
        completed_at:
          newProgress >= challenge.goal && !userChallenge.completed
            ? new Date().toISOString()
            : userChallenge.completed_at,
      })
      .eq('id', userChallenge.id)
  }
}

/**
 * Get challenge completion stats
 */
export async function getChallengeStats(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_challenges')
    .select('completed')
    .eq('user_id', userId)

  if (error) throw error

  const total = data?.length || 0
  const completed = data?.filter((c) => c.completed).length || 0

  return {
    totalChallenges: total,
    completedChallenges: completed,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  }
}

/**
 * Get challenge points earned today
 */
export async function getTodayPoints(userId: string): Promise<number> {
  const challenges = await getTodayChallenges(userId)

  return challenges.reduce((total, userChallenge) => {
    if (userChallenge.completed) {
      const challenge = DAILY_CHALLENGES.find(
        (c) => c.id === userChallenge.challengeId
      )
      return total + (challenge?.points || 0)
    }
    return total
  }, 0)
}
