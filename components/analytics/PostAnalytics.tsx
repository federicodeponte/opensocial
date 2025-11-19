// ABOUTME: Post-level analytics component
// ABOUTME: Detailed metrics for individual posts

'use client'

import { useState } from 'react'
import { Eye, Heart, Repeat2, MessageCircle, TrendingUp, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PostMetrics {
  postId: string
  content: string
  impressions: number
  engagements: number
  likes: number
  retweets: number
  replies: number
  clicks: number
  profileClicks: number
  engagementRate: number
  createdAt: string
}

interface PostAnalyticsProps {
  postId: string
}

export function PostAnalytics({ postId }: PostAnalyticsProps) {
  const [metrics, setMetrics] = useState<PostMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock data
  useState(() => {
    setMetrics({
      postId,
      content: 'Example post content...',
      impressions: 1543,
      engagements: 187,
      likes: 124,
      retweets: 32,
      replies: 18,
      clicks: 13,
      profileClicks: 8,
      engagementRate: 12.1,
      createdAt: new Date().toISOString(),
    })
    setLoading(false)
  })

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading post analytics...</div>
  }

  if (!metrics) {
    return <div className="text-center py-8 text-gray-500">No analytics available</div>
  }

  const engagementBreakdown = [
    { label: 'Likes', value: metrics.likes, icon: <Heart className="h-4 w-4" />, color: 'text-pink-600' },
    { label: 'Retweets', value: metrics.retweets, icon: <Repeat2 className="h-4 w-4" />, color: 'text-green-600' },
    { label: 'Replies', value: metrics.replies, icon: <MessageCircle className="h-4 w-4" />, color: 'text-blue-600' },
    { label: 'Clicks', value: metrics.clicks, icon: <Eye className="h-4 w-4" />, color: 'text-purple-600' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Post Analytics</h3>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{metrics.impressions.toLocaleString()}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Impressions</div>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{metrics.engagements.toLocaleString()}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Engagements</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{metrics.engagementRate}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</div>
        </div>
      </div>

      {/* Engagement Breakdown */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Engagement Breakdown</h4>
        {engagementBreakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={item.color}>{item.icon}</div>
              <span className="text-sm">{item.label}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.color.replace('text-', 'bg-')}`}
                  style={{ width: `${(item.value / metrics.engagements) * 100}%` }}
                />
              </div>
              <span className="font-medium text-sm w-12 text-right">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Profile Clicks</div>
          <div className="text-lg font-semibold">{metrics.profileClicks}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Posted</div>
          <div className="text-lg font-semibold">
            {new Date(metrics.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
