// ABOUTME: Analytics API endpoint (FREE - PostgreSQL functions)
// ABOUTME: User stats, post analytics, engagement metrics, CSV export

import { createClient } from '@/lib/auth/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const days = parseInt(searchParams.get('days') || '30')
    const userId = searchParams.get('userId') || user.id

    let data

    switch (type) {
      case 'summary':
        // Get user analytics summary
        const { data: summaryData, error: summaryError } = await supabase
          .rpc('get_user_analytics', { user_uuid: userId, days_back: days })

        if (summaryError) throw summaryError
        data = summaryData
        break

      case 'follower_growth':
        // Get follower growth over time
        const { data: followerData, error: followerError } = await supabase
          .rpc('get_follower_growth', { user_uuid: userId, days_back: days })

        if (followerError) throw followerError
        data = followerData
        break

      case 'post_analytics':
        // Get post performance metrics
        const { data: postData, error: postError } = await supabase
          .rpc('get_post_analytics', { user_uuid: userId, days_back: days })

        if (postError) throw postError
        data = postData
        break

      case 'daily_activity':
        // Get daily activity
        const { data: activityData, error: activityError } = await supabase
          .rpc('get_daily_activity', { user_uuid: userId, days_back: days })

        if (activityError) throw activityError
        data = activityData
        break

      case 'top_posts':
        // Get top performing posts
        const limit = parseInt(searchParams.get('limit') || '10')
        const { data: topData, error: topError } = await supabase
          .rpc('get_top_posts', { user_uuid: userId, limit_count: limit })

        if (topError) throw topError
        data = topData
        break

      case 'hourly_engagement':
        // Get engagement by hour
        const { data: hourlyData, error: hourlyError } = await supabase
          .rpc('get_hourly_engagement', { user_uuid: userId })

        if (hourlyError) throw hourlyError
        data = hourlyData
        break

      case 'audience':
        // Get audience activity
        const { data: audienceData, error: audienceError } = await supabase
          .rpc('get_audience_activity', { user_uuid: userId })

        if (audienceError) throw audienceError
        data = audienceData
        break

      case 'export':
        // Export analytics as CSV-ready JSON
        const { data: exportData, error: exportError } = await supabase
          .rpc('export_user_analytics', { user_uuid: userId, days_back: days })

        if (exportError) throw exportError

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(exportData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="analytics-${userId}-${Date.now()}.json"`,
          },
        })

      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      type,
      data,
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Refresh materialized views
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Refresh analytics views
    const { error } = await supabase.rpc('refresh_analytics')

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Analytics refreshed successfully',
    })
  } catch (error: any) {
    console.error('Analytics refresh error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to refresh analytics' },
      { status: 500 }
    )
  }
}
