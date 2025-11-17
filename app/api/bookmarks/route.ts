// ABOUTME: API endpoints for bookmarks
// ABOUTME: GET to fetch user's bookmarks

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * GET /api/bookmarks
 * Get current user's bookmarked posts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's bookmarks with post details
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        created_at,
        post_id,
        posts!inner (
          id,
          content,
          created_at,
          image_urls,
          reply_to_id,
          quote_tweet_id,
          profiles!inner (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    // For each post, get engagement counts
    const postsWithEngagement = await Promise.all(
      bookmarks.map(async (bookmark: any) => {
        const post = bookmark.posts

        // Get like count and whether user liked
        const { count: likeCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)

        const { data: userLike } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle()

        // Get retweet count and whether user retweeted
        const { count: retweetCount } = await supabase
          .from('retweets')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)

        const { data: userRetweet } = await supabase
          .from('retweets')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle()

        // Get reply count
        const { count: replyCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('reply_to_id', post.id)

        return {
          ...post,
          like_count: likeCount || 0,
          retweet_count: retweetCount || 0,
          reply_count: replyCount || 0,
          liked_by_user: !!userLike,
          retweeted_by_user: !!userRetweet,
          bookmarked_at: bookmark.created_at,
        }
      })
    )

    return NextResponse.json({ data: postsWithEngagement })
  } catch (error) {
    return handleApiError(error)
  }
}
