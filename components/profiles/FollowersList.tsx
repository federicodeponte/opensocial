// ABOUTME: Followers list component showing users who follow a profile
// ABOUTME: Displays profile cards with follow/unfollow buttons

'use client'

import { useFollowers } from '@/lib/hooks/useProfile'
import { ProfileCard } from './ProfileCard'

interface FollowersListProps {
  username: string
}

export function FollowersList({ username }: FollowersListProps) {
  const { data: followers, isLoading, error } = useFollowers(username)

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-300" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-300 rounded" />
                  <div className="h-4 w-24 bg-gray-300 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Failed to load followers
        </div>
      </div>
    )
  }

  if (!followers || followers.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          No followers yet
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Followers</h2>
      <div className="space-y-4">
        {followers.map((follow) => (
          <div
            key={follow.follower_id}
            className="bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            {follow.follower_profile && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {follow.follower_profile.avatar_url ? (
                    <img
                      src={follow.follower_profile.avatar_url}
                      alt={follow.follower_profile.display_name || follow.follower_profile.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {(follow.follower_profile.display_name?.[0] || follow.follower_profile.username[0]).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <a
                      href={`/${follow.follower_profile.username}`}
                      className="font-semibold hover:underline"
                    >
                      {follow.follower_profile.display_name || follow.follower_profile.username}
                    </a>
                    <p className="text-sm text-gray-500">@{follow.follower_profile.username}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
