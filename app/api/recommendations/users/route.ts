// ABOUTME: API route for user recommendations ("Who to Follow")
// ABOUTME: Returns personalized user suggestions based on social graph and activity

import { createClient } from '@/lib/auth/supabase-server'
import { NextResponse } from 'next/server'
import {
  calculateUserRecommendationScore,
  getRecommendationReason,
  calculateBioSimilarity,
  type UserRecommendation,
} from '@/lib/algorithms/user-recommendations'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's profile
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('bio')
      .eq('id', user.id)
      .single()

    // Get users that current user follows
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = following?.map((f) => f.following_id) || []

    // Get second-degree connections (people followed by people you follow)
    const { data: secondDegree } = await supabase
      .from('follows')
      .select('following_id, follower_id')
      .in('follower_id', followingIds)
      .not('following_id', 'in', `(${[user.id, ...followingIds].join(',')})`)
      .limit(50)

    const candidateIds = secondDegree?.map((f) => f.following_id) || []

    if (candidateIds.length === 0) {
      // Fallback: get popular active users
      const { data: popularUsers } = await supabase
        .from('profiles')
        .select('id')
        .not('id', 'in', `(${[user.id, ...followingIds].join(',')})`)
        .order('followers_count', { ascending: false })
        .limit(20)

      candidateIds.push(...(popularUsers?.map((u) => u.id) || []))
    }

    // Get candidate user profiles with stats
    const { data: candidates } = await supabase
      .from('profiles')
      .select(
        `
        id,
        username,
        display_name,
        avatar_url,
        bio,
        followers_count,
        created_at
      `
      )
      .in('id', candidateIds)

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    // Get post counts and recent activity for candidates
    const { data: postStats } = await supabase
      .from('posts')
      .select('user_id, created_at')
      .in(
        'user_id',
        candidates.map((c) => c.id)
      )
      .order('created_at', { ascending: false })

    // Calculate post counts and last post time
    const userPostStats = candidates.map((candidate) => {
      const userPosts =
        postStats?.filter((p) => p.user_id === candidate.id) || []
      const lastPost = userPosts[0]
      const lastPostHoursAgo = lastPost
        ? (Date.now() - new Date(lastPost.created_at).getTime()) /
          (1000 * 60 * 60)
        : 999999

      return {
        user_id: candidate.id,
        posts_count: userPosts.length,
        last_post_hours_ago: lastPostHoursAgo,
      }
    })

    // Calculate mutual follows for each candidate
    const mutualFollowsMap = new Map<string, string[]>()
    for (const candidate of candidates) {
      const { data: mutualFollowers } = await supabase
        .from('follows')
        .select('follower_id, profiles:follower_id(username)')
        .eq('following_id', candidate.id)
        .in('follower_id', followingIds)
        .limit(3)

      const usernames = mutualFollowers
        ?.map((mf: any) => mf.profiles?.username)
        .filter(Boolean) as string[]
      mutualFollowsMap.set(candidate.id, usernames || [])
    }

    // Score and rank recommendations
    const recommendations: UserRecommendation[] = candidates
      .map((candidate) => {
        const stats = userPostStats.find((s) => s.user_id === candidate.id)!
        const mutualFollowers = mutualFollowsMap.get(candidate.id) || []
        const bioSimilarity = calculateBioSimilarity(
          currentProfile?.bio || null,
          candidate.bio
        )

        const score = calculateUserRecommendationScore({
          followers_count: candidate.followers_count,
          posts_count: stats.posts_count,
          mutual_follows_count: mutualFollowers.length,
          last_post_hours_ago: stats.last_post_hours_ago,
          bio_similarity: bioSimilarity,
        })

        return {
          user_id: candidate.id,
          username: candidate.username,
          display_name: candidate.display_name,
          avatar_url: candidate.avatar_url,
          bio: candidate.bio,
          is_verified: false, // TODO: Add is_verified column to profiles table
          followers_count: candidate.followers_count,
          reason: getRecommendationReason(mutualFollowers, bioSimilarity),
          score,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Error in user recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
