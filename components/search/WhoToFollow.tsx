// ABOUTME: "Who to Follow" widget showing suggested users based on popularity
// ABOUTME: Displays top users not followed by current user with follow buttons

'use client'

import Link from 'next/link'
import { useSuggestedUsers } from '@/lib/hooks/useSearch'
import { FollowButton } from '@/components/profiles/FollowButton'
import { Card } from '@/components/ui/card'

interface WhoToFollowProps {
  limit?: number
}

export function WhoToFollow({ limit = 5 }: WhoToFollowProps) {
  const { data: suggestedUsers, isLoading } = useSuggestedUsers({ limit })

  if (isLoading) {
    return (
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Who to follow</h2>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-9 w-20 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (!suggestedUsers || suggestedUsers.length === 0) {
    return null
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Who to follow</h2>
      <div className="space-y-4">
        {suggestedUsers.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Link href={`/${user.username}`} className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold hover:opacity-80 transition-opacity">
                {(user.display_name?.[0] || user.username[0]).toUpperCase()}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/${user.username}`}
                className="font-semibold hover:underline block truncate"
              >
                {user.display_name || user.username}
              </Link>
              <Link
                href={`/${user.username}`}
                className="text-gray-500 text-sm hover:underline block truncate"
              >
                @{user.username}
              </Link>
            </div>

            <FollowButton username={user.username} isFollowing={user.isFollowing || false} />
          </div>
        ))}
      </div>

      <Link
        href="/explore"
        className="block mt-4 text-blue-600 hover:underline text-sm font-medium"
      >
        Show more
      </Link>
    </Card>
  )
}
