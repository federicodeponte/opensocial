// ABOUTME: Analytics dashboard page showing user statistics
// ABOUTME: Displays posts, engagement, followers, and activity metrics

'use client'

import { useUserAnalytics } from '@/lib/hooks/useAnalytics'
import { Card } from '@/components/ui/card'
import { TrendingUp, Users, Eye, Heart, Repeat, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useUserAnalytics()

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Analytics</h1>
        <Card className="p-6">
          <p className="text-gray-500">Failed to load analytics</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Posts</p>
              <p className="text-3xl font-bold">{analytics.posts.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.posts.avgPerDay} posts/day
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-semibold">{analytics.posts.thisWeek}</span> this week •{' '}
            <span className="font-semibold">{analytics.posts.thisMonth}</span> this month
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Followers</p>
              <p className="text-3xl font-bold">{analytics.followers.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                +{analytics.followers.thisWeek} this week
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-semibold">+{analytics.followers.thisMonth}</span> this month
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-3xl font-bold">{analytics.engagement.totalViews}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <Eye className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Engagement</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{analytics.engagement.totalLikes}</p>
              <p className="text-xs text-gray-500">
                {analytics.engagement.avgLikesPerPost} avg/post
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Repeat className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{analytics.engagement.totalRetweets}</p>
              <p className="text-xs text-gray-500">
                {analytics.engagement.avgRetweetsPerPost} avg/post
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{analytics.engagement.totalReplies}</p>
              <p className="text-xs text-gray-500">Total replies</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{analytics.engagement.totalViews}</p>
              <p className="text-xs text-gray-500">Total views</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Last 7 Days Activity</h2>
        <div className="space-y-2">
          {analytics.recentActivity.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-24">
                {new Date(day.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <div className="flex-1 flex gap-2">
                <div
                  className="bg-blue-500 h-8 rounded flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${Math.max(10, day.posts * 20)}px` }}
                >
                  {day.posts > 0 && day.posts}
                </div>
                <span className="text-xs text-gray-500 self-center">
                  {day.posts} post{day.posts !== 1 ? 's' : ''}, {day.likes} like
                  {day.likes !== 1 ? 's' : ''}, {day.views} view{day.views !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Posts */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Top Posts</h2>
        <div className="space-y-3">
          {analytics.topPosts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm mb-2 line-clamp-2">{post.content}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>❤️ {post.likes_count}</span>
                <span>🔁 {post.retweets_count}</span>
                <span>💬 {post.replies_count}</span>
                <span>👁️ {post.views_count}</span>
                <span className="ml-auto">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
          {analytics.topPosts.length === 0 && (
            <p className="text-gray-500 text-center py-4">No posts yet</p>
          )}
        </div>
      </Card>
    </div>
  )
}
