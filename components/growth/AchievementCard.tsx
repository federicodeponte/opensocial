// ABOUTME: Achievement card component
// ABOUTME: Display achievement with progress bar and rarity

'use client'

import { Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  type Achievement,
  getAchievementProgress,
  getRarityColor,
} from '@/lib/growth/achievements'

interface AchievementCardProps {
  achievement: Achievement
  unlocked: boolean
  progress?: number
}

export function AchievementCard({
  achievement,
  unlocked,
  progress = 0,
}: AchievementCardProps) {
  const progressPercent = getAchievementProgress(achievement, progress)
  const rarityColor = getRarityColor(achievement.rarity)

  return (
    <Card
      className={`p-4 ${
        unlocked
          ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950'
          : 'opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`text-3xl ${
            unlocked ? 'grayscale-0' : 'grayscale opacity-40'
          }`}
        >
          {achievement.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{achievement.name}</h3>
            {!unlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            {achievement.description}
          </p>

          {!unlocked && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {progress} / {achievement.requirement}
                </span>
                <span className={rarityColor}>{achievement.rarity}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {unlocked && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                ✓ Unlocked
              </span>
              <span className="text-xs text-muted-foreground">
                +{achievement.points} pts
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
