// ABOUTME: API endpoint for hashtag posts
// ABOUTME: Returns posts containing a specific hashtag

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

interface RouteContext {
  params: Promise<{ tag: string }>
}

/**
 * GET /api/hashtags/[tag]
 * Get posts containing a specific hashtag
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { tag } = await context.params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Normalize tag (lowercase, remove # if present)
    const normalizedTag = tag.toLowerCase().replace(/^#/, '')

    // Get hashtag
    const { data: hashtag, error: hashtagError } = await supabase
      .from('hashtags')
      .select('id, tag')
      .eq('tag', normalizedTag)
      .maybeSingle()

    if (hashtagError) {
      throw hashtagError
    }

    if (!hashtag) {
      return NextResponse.json({ data: [] })
    }

    // Get posts with this hashtag
    const { data: postHashtags, error: postsError } = await supabase
      .from('post_hashtags')
      .select(`
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
      .eq('hashtag_id', hashtag.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (postsError) {
      throw postsError
    }

    // For each post, get engagement counts
    const postsWithEngagement = await Promise.all(
      postHashtags.map(async (ph: any) => {
        const post = ph.posts

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
        }
      })
    )

    return NextResponse.json({
      data: {
        hashtag,
        posts: postsWithEngagement,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
