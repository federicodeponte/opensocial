// ABOUTME: Analytics dashboard with Recharts (FREE - PostgreSQL backend)
// ABOUTME: User stats, follower growth, engagement metrics, top posts

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { useAnalyticsSummary, useDailyActivity, useTopPosts, exportAnalytics } from '@/lib/hooks/useAnalytics'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [exporting, setExporting] = useState(false)

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(undefined, days)
  const { data: dailyActivity, isLoading: activityLoading } = useDailyActivity(undefined, days)
  const { data: topPosts, isLoading: topPostsLoading } = useTopPosts(undefined, 5)

  const handleExport = async () => {
    try {
      setExporting(true)
      await exportAnalytics(undefined, days)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const loading = summaryLoading || activityLoading || topPostsLoading

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your performance with FREE analytics (PostgreSQL)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>
      </div>

      {/* Date range selector */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={days === 7 ? 'default' : 'outline'}
          onClick={() => setDays(7)}
        >
          7 Days
        </Button>
        <Button
          variant={days === 30 ? 'default' : 'outline'}
          onClick={() => setDays(30)}
        >
          30 Days
        </Button>
        <Button
          variant={days === 90 ? 'default' : 'outline'}
          onClick={() => setDays(90)}
        >
          90 Days
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Posts</CardDescription>
                <CardTitle className="text-3xl">{summary?.total_posts || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Last {days} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Likes</CardDescription>
                <CardTitle className="text-3xl">{summary?.total_likes_received || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Received on your posts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Followers</CardDescription>
                <CardTitle className="text-3xl">{summary?.total_followers || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Following: {summary?.total_following || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Engagement Rate</CardDescription>
                <CardTitle className="text-3xl">{summary?.engagement_rate || 0}%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Likes per post
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Activity Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>
                Posts and likes over the last {days} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActivity || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="post_count" stroke="#8884d8" name="Posts" />
                  <Line type="monotone" dataKey="like_count" stroke="#82ca9d" name="Likes" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Posts */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
              <CardDescription>
                Your best content by total engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topPosts || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="content" 
                    tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="likes" fill="#8884d8" name="Likes" />
                  <Bar dataKey="retweets" fill="#82ca9d" name="Retweets" />
                  <Bar dataKey="replies" fill="#ffc658" name="Replies" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement Breakdown */}
          {topPosts && topPosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
                <CardDescription>
                  Distribution of engagement types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Likes', value: topPosts.reduce((sum, p) => sum + p.likes, 0) },
                        { name: 'Retweets', value: topPosts.reduce((sum, p) => sum + p.retweets, 0) },
                        { name: 'Replies', value: topPosts.reduce((sum, p) => sum + p.replies, 0) },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Cost Savings Banner */}
          <Card className="mt-6 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">100% FREE Analytics</CardTitle>
              <CardDescription className="text-green-700">
                Powered by PostgreSQL - No external analytics service needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-800">$0/month</div>
                  <div className="text-sm text-green-700">Our cost</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-800">vs $25/mo</div>
                  <div className="text-sm text-green-700">Mixpanel/Amplitude</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-800">Unlimited</div>
                  <div className="text-sm text-green-700">Events tracked</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
