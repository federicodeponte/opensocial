// ABOUTME: API endpoint for user analytics and statistics
// ABOUTME: Returns comprehensive stats about user's posts, engagement, and growth

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

export interface UserAnalytics {
  posts: {
    total: number
    thisWeek: number
    thisMonth: number
    avgPerDay: number
  }
  engagement: {
    totalLikes: number
    totalRetweets: number
    totalReplies: number
    totalViews: number
    avgLikesPerPost: number
    avgRetweetsPerPost: number
  }
  followers: {
    total: number
    thisWeek: number
    thisMonth: number
  }
  topPosts: Array<{
    id: string
    content: string
    likes_count: number
    retweets_count: number
    replies_count: number
    views_count: number
    created_at: string
  }>
  recentActivity: Array<{
    date: string
    posts: number
    likes: number
    views: number
  }>
}

/**
 * GET /api/analytics/me
 * Get analytics for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get post statistics
    const { data: allPosts } = await supabase
      .from('posts')
      .select('id, created_at, likes_count, retweets_count, replies_count, views_count')
      .eq('user_id', user.id)

    const totalPosts = allPosts?.length || 0
    const postsThisWeek =
      allPosts?.filter((p) => new Date(p.created_at) >= oneWeekAgo).length || 0
    const postsThisMonth =
      allPosts?.filter((p) => new Date(p.created_at) >= oneMonthAgo).length || 0

    // Calculate engagement metrics
    const totalLikes = allPosts?.reduce((sum, p) => sum + p.likes_count, 0) || 0
    const totalRetweets = allPosts?.reduce((sum, p) => sum + p.retweets_count, 0) || 0
    const totalReplies = allPosts?.reduce((sum, p) => sum + p.replies_count, 0) || 0
    const totalViews = allPosts?.reduce((sum, p) => sum + p.views_count, 0) || 0

    const avgLikesPerPost = totalPosts > 0 ? totalLikes / totalPosts : 0
    const avgRetweetsPerPost = totalPosts > 0 ? totalRetweets / totalPosts : 0

    // Get follower statistics
    const { data: allFollowers } = await supabase
      .from('follows')
      .select('created_at')
      .eq('following_id', user.id)

    const totalFollowers = allFollowers?.length || 0
    const followersThisWeek =
      allFollowers?.filter((f) => new Date(f.created_at) >= oneWeekAgo).length || 0
    const followersThisMonth =
      allFollowers?.filter((f) => new Date(f.created_at) >= oneMonthAgo).length || 0

    // Get top posts
    const { data: topPosts } = await supabase
      .from('posts')
      .select('id, content, likes_count, retweets_count, replies_count, views_count, created_at')
      .eq('user_id', user.id)
      .order('likes_count', { ascending: false })
      .limit(5)

    // Calculate activity by day (last 7 days)
    const recentActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000)

      const dayPosts =
        allPosts?.filter((p) => {
          const postDate = new Date(p.created_at)
          return postDate >= date && postDate < nextDay
        }) || []

      const dayLikes = dayPosts.reduce((sum, p) => sum + p.likes_count, 0)
      const dayViews = dayPosts.reduce((sum, p) => sum + p.views_count, 0)

      recentActivity.push({
        date: dateStr,
        posts: dayPosts.length,
        likes: dayLikes,
        views: dayViews,
      })
    }

    // Calculate average posts per day
    const accountAge = allPosts?.[allPosts.length - 1]
      ? Math.max(
          1,
          Math.floor(
            (now.getTime() - new Date(allPosts[allPosts.length - 1].created_at).getTime()) /
              (24 * 60 * 60 * 1000)
          )
        )
      : 1
    const avgPerDay = totalPosts / accountAge

    const analytics: UserAnalytics = {
      posts: {
        total: totalPosts,
        thisWeek: postsThisWeek,
        thisMonth: postsThisMonth,
        avgPerDay: Math.round(avgPerDay * 100) / 100,
      },
      engagement: {
        totalLikes,
        totalRetweets,
        totalReplies,
        totalViews,
        avgLikesPerPost: Math.round(avgLikesPerPost * 100) / 100,
        avgRetweetsPerPost: Math.round(avgRetweetsPerPost * 100) / 100,
      },
      followers: {
        total: totalFollowers,
        thisWeek: followersThisWeek,
        thisMonth: followersThisMonth,
      },
      topPosts: topPosts || [],
      recentActivity,
    }

    return NextResponse.json({ data: analytics })
  } catch (error) {
    return handleApiError(error)
  }
}
