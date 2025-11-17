// ABOUTME: API route for fetching trending posts
// ABOUTME: Returns top posts by trending score in specified time window

import { createClient } from '@/lib/auth/supabase-server'
import { NextResponse } from 'next/server'
import {
  calculateTrendingScore,
  TRENDING_WINDOWS,
} from '@/lib/algorithms/trending-score'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const window = searchParams.get('window') || 'TODAY'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get time window in hours
    const hours =
      TRENDING_WINDOWS[window as keyof typeof TRENDING_WINDOWS] ||
      TRENDING_WINDOWS.TODAY

    // Calculate cutoff time
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    // Fetch recent posts with engagement metrics
    const { data: posts, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        likes:likes(count),
        retweets:retweets(count),
        replies:posts!reply_to_id(count),
        views:post_views(count)
      `
      )
      .is('reply_to_id', null) // Only top-level posts
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(100) // Get more than needed for scoring

    if (error) {
      console.error('Error fetching trending posts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    // Calculate trending scores and sort
    const postsWithScores = posts
      .map((post) => {
        // Extract counts from aggregate results
        const likes_count = Array.isArray(post.likes) && post.likes.length > 0 ? (post.likes[0] as any).count : 0
        const retweets_count = Array.isArray(post.retweets) && post.retweets.length > 0 ? (post.retweets[0] as any).count : 0
        const replies_count = Array.isArray(post.replies) && post.replies.length > 0 ? (post.replies[0] as any).count : 0
        const views_count = Array.isArray(post.views) && post.views.length > 0 ? (post.views[0] as any).count : 0

        return {
          ...post,
          likes_count,
          retweets_count,
          replies_count,
          views_count,
          trending_score: calculateTrendingScore({
            likes_count,
            retweets_count,
            replies_count,
            views_count,
            created_at: post.created_at,
          }),
        }
      })
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit)

    return NextResponse.json({ posts: postsWithScores })
  } catch (error) {
    console.error('Error in trending posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
