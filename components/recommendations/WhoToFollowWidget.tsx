// ABOUTME: Enhanced "Who to Follow" widget with smart recommendations
// ABOUTME: Shows personalized user suggestions based on social graph and interests

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import Link from 'next/link'
import { useState } from 'react'

interface UserRecommendation {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
  followers_count: number
  reason: string
  score: number
}

interface WhoToFollowWidgetProps {
  limit?: number
}

export function WhoToFollowWidget({ limit = 3 }: WhoToFollowWidgetProps) {
  const queryClient = useQueryClient()
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-recommendations', limit],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/users?limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      return response.json()
    },
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  })

  const followMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(`/api/profiles/${username}/follow`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to follow user')
      return response.json()
    },
    onSuccess: (_, username) => {
      setFollowedUsers((prev) => new Set(prev).add(username))
      queryClient.invalidateQueries({ queryKey: ['user-recommendations'] })
    },
  })

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-5 w-5" />
          <h3 className="font-bold text-lg">Who to follow</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-5 w-5" />
          <h3 className="font-bold text-lg">Who to follow</h3>
        </div>
        <div className="text-center py-4 text-sm text-gray-500">
          Failed to load recommendations
        </div>
      </div>
    )
  }

  const recommendations: UserRecommendation[] = data?.recommendations || []

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="h-5 w-5" />
        <h3 className="font-bold text-lg">Who to follow</h3>
      </div>
      <div className="space-y-3">
        {recommendations.map((user) => {
          const isFollowed = followedUsers.has(user.username)
          const isFollowing = followMutation.isPending

          return (
            <div
              key={user.user_id}
              className="flex items-start gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <Link href={`/profile/${user.username}`}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {user.display_name?.[0] || user.username[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/profile/${user.username}`}>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm truncate">
                      {user.display_name || user.username}
                    </span>
                    {user.is_verified && <VerifiedBadge size="sm" />}
                  </div>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </Link>

                {/* Recommendation reason */}
                <p className="text-xs text-gray-400 mt-1">{user.reason}</p>

                {/* Follow button */}
                <Button
                  size="sm"
                  variant={isFollowed ? 'outline' : 'default'}
                  className="mt-2 w-full"
                  onClick={() => followMutation.mutate(user.username)}
                  disabled={isFollowing || isFollowed}
                >
                  {isFollowing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowed ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Link
        href="/explore/people"
        className="block mt-3 text-sm text-blue-500 hover:underline text-center"
      >
        Show more
      </Link>
    </div>
  )
}
