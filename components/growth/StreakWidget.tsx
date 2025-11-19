// ABOUTME: Streak and daily challenges widget
// ABOUTME: Display current streak and today's challenges

'use client'

import { useState, useEffect } from 'react'
import { Flame, Trophy, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  getUserStreak,
  getTodayChallenges,
  getTodayPoints,
  type Streak,
  type UserChallenge,
  DAILY_CHALLENGES,
} from '@/lib/growth/streaks'

interface StreakWidgetProps {
  userId: string
}

export function StreakWidget({ userId }: StreakWidgetProps) {
  const [streak, setStreak] = useState<Streak | null>(null)
  const [challenges, setChallenges] = useState<UserChallenge[]>([])
  const [pointsToday, setPointsToday] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [streakData, challengesData, points] = await Promise.all([
          getUserStreak(userId),
          getTodayChallenges(userId),
          getTodayPoints(userId),
        ])
        setStreak(streakData)
        setChallenges(challengesData)
        setPointsToday(points)
      } catch (error) {
        console.error('Failed to load streak data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Streak Card */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
            <div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
              <div className="text-3xl font-bold">
                {streak?.currentStreak || 0} days
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">Best Streak</div>
            <div className="text-xl font-semibold">
              {streak?.longestStreak || 0} days
            </div>
          </div>
        </div>

        {streak && streak.currentStreak > 0 && (
          <div className="mt-4 text-sm text-center text-muted-foreground">
            Keep it up! Post today to maintain your streak 🔥
          </div>
        )}
      </Card>

      {/* Daily Challenges Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Today's Challenges
          </h3>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            +{pointsToday} pts earned
          </span>
        </div>

        <div className="space-y-3">
          {challenges.map((userChallenge) => {
            const challenge = DAILY_CHALLENGES.find(
              (c) => c.id === userChallenge.challengeId
            )
            if (!challenge) return null

            const progress = Math.min(userChallenge.progress, challenge.goal)
            const progressPercent = (progress / challenge.goal) * 100

            return (
              <div
                key={userChallenge.id}
                className={`p-3 rounded-lg border ${
                  userChallenge.completed
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{challenge.icon}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{challenge.name}</h4>
                      {userChallenge.completed && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {challenge.description}
                    </p>

                    {!userChallenge.completed && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {progress} / {challenge.goal}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">
                            +{challenge.points} pts
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {userChallenge.completed && (
                      <div className="text-xs font-medium text-green-600 dark:text-green-400">
                        Completed! +{challenge.points} pts
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
