// ABOUTME: Leaderboard widget component
// ABOUTME: Display top users with rankings

'use client'

import { useState, useEffect } from 'react'
import { Trophy, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  getLeaderboard,
  getLeaderboardInfo,
  type LeaderboardEntry,
  type LeaderboardType,
} from '@/lib/growth/leaderboards'

interface LeaderboardWidgetProps {
  type: LeaderboardType
  limit?: number
  currentUserId?: string
}

export function LeaderboardWidget({
  type,
  limit = 10,
  currentUserId,
}: LeaderboardWidgetProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const info = getLeaderboardInfo(type)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard(type, limit)
        setEntries(data)
      } catch (error) {
        console.error('Failed to load leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [type, limit])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading...</div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">{info.icon}</div>
        <div>
          <h3 className="text-lg font-semibold">{info.title}</h3>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => {
          const isCurrentUser = currentUserId && entry.userId === currentUserId

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isCurrentUser
                  ? 'bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-500'
                  : 'bg-gray-50 dark:bg-gray-900'
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                {entry.rank <= 3 ? (
                  <span className="text-2xl">
                    {entry.rank === 1 && '🥇'}
                    {entry.rank === 2 && '🥈'}
                    {entry.rank === 3 && '🥉'}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">
                    #{entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              {entry.avatarUrl ? (
                <img
                  src={entry.avatarUrl}
                  alt={entry.displayName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                  {entry.displayName[0]}
                </div>
              )}

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{entry.displayName}</div>
                <div className="text-sm text-muted-foreground truncate">
                  @{entry.username}
                </div>
              </div>

              {/* Score */}
              <div className="flex-shrink-0 text-right">
                <div className="font-bold text-lg">{entry.score.toLocaleString()}</div>
                {entry.change !== undefined && (
                  <div
                    className={`text-xs flex items-center gap-1 ${
                      entry.change > 0
                        ? 'text-green-600'
                        : entry.change < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {entry.change > 0 && '+'}
                    {entry.change}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No data available yet
        </div>
      )}
    </Card>
  )
}
