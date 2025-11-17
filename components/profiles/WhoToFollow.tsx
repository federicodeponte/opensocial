// ABOUTME: "Who to Follow" widget showing suggested users
// ABOUTME: Displays on sidebar with follow buttons

'use client'

import { useQuery } from '@tanstack/react-query'
import { FollowButton } from './FollowButton'
import type { ProfileWithFollowStatus } from '@/lib/hooks/useProfile'
import { Card } from '@/components/ui/card'

export function WhoToFollow() {
  const { data: suggestions, isLoading } = useQuery<ProfileWithFollowStatus[]>({
    queryKey: ['suggested-users'],
    queryFn: async () => {
      const response = await fetch('/api/search/suggested?limit=5')
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }
      const { data } = await response.json()
      return data
    },
  })

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4">Who to follow</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-300" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-300 rounded" />
                <div className="h-4 w-24 bg-gray-300 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (!suggestions || suggestions.length === 0) {
    return null
  }

  return (
    <Card className="p-4">
      <h3 className="font-bold text-lg mb-4">Who to follow</h3>
      <div className="space-y-4">
        {suggestions.map((profile) => (
          <div key={profile.id} className="flex items-start justify-between gap-3">
            <a
              href={`/${profile.username}`}
              className="flex items-center gap-3 flex-1 hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {(profile.display_name?.[0] || profile.username[0]).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {profile.display_name || profile.username}
                </p>
                <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
              </div>
            </a>
            <FollowButton
              username={profile.username}
              isFollowing={false}
              className="flex-shrink-0"
            />
          </div>
        ))}
      </div>
    </Card>
  )
}
