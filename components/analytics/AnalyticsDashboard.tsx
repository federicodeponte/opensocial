// ABOUTME: Comprehensive analytics dashboard
// ABOUTME: Track impressions, engagement, reach, and follower growth

'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Users,
  BarChart3,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TimePeriod } from '@/lib/analytics/aggregation'

interface AnalyticsStat {
  label: string
  value: number
  change: { value: number; isPositive: boolean }
  icon: React.ReactNode
  color: string
}

interface AnalyticsDashboardProps {
  userId: string
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<TimePeriod>('30d')
  const [stats, setStats] = useState<AnalyticsStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [userId, period])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // TODO: Fetch from API
      // const response = await fetch(`/api/analytics/${userId}?period=${period}`)
      // const data = await response.json()

      // Mock data for now
      setStats([
        {
          label: 'Impressions',
          value: 12543,
          change: { value: 12.5, isPositive: true },
          icon: <Eye className="h-5 w-5" />,
          color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        },
        {
          label: 'Engagements',
          value: 1842,
          change: { value: 8.3, isPositive: true },
          icon: <Heart className="h-5 w-5" />,
          color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
        },
        {
          label: 'Followers',
          value: 523,
          change: { value: 15.2, isPositive: true },
          icon: <Users className="h-5 w-5" />,
          color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
        },
        {
          label: 'Engagement Rate',
          value: 14.7,
          change: { value: 2.1, isPositive: false },
          icon: <BarChart3 className="h-5 w-5" />,
          color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        },
      ])
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const periodLabels: Record<TimePeriod, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    all: 'All time',
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12 text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your performance and audience growth
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(Object.keys(periodLabels) as TimePeriod[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  stat.change.isPositive
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {stat.change.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {stat.change.value}%
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {stat.label}
            </div>
            <div className="text-3xl font-bold">
              {stat.label === 'Engagement Rate'
                ? `${stat.value}%`
                : stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Impressions Over Time</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chart will appear here</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Follower Growth</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chart will appear here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Insights & Recommendations
        </h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-lg">🔥</span>
            <p className="text-sm">
              <strong>Excellent engagement rate</strong> - Your content is resonating well with your audience
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">📈</span>
            <p className="text-sm">
              <strong>Strong follower growth</strong> - You're gaining followers consistently
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <p className="text-sm">
              <strong>Best posting time</strong> - Your audience is most active at 2:00 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
