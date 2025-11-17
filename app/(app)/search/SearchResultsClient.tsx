// ABOUTME: Client component for search results with React Query
// ABOUTME: Handles user search and displays results with follow buttons

'use client'

import Link from 'next/link'
import { useSearchUsers } from '@/lib/hooks/useSearch'
import { FollowButton } from '@/components/profiles/FollowButton'
import { Card } from '@/components/ui/card'

interface SearchResultsClientProps {
  query: string
}

export default function SearchResultsClient({ query }: SearchResultsClientProps) {
  const { data: users, isLoading } = useSearchUsers({ query, limit: 20 })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
              <div className="h-10 w-24 bg-gray-200 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!query || query.trim().length < 2) {
    return (
      <Card className="p-12 text-center">
        <div className="text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Search for users</h3>
          <p className="text-sm text-gray-500">Enter at least 2 characters to search</p>
        </div>
      </Card>
    )
  }

  if (!users || users.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
          <p className="text-sm text-gray-500">
            No users match your search for &quot;{query}&quot;
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <Link href={`/${user.username}`} className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xl hover:opacity-80 transition-opacity">
                {(user.display_name?.[0] || user.username[0]).toUpperCase()}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/${user.username}`}
                className="font-semibold text-lg hover:underline block truncate"
              >
                {user.display_name || user.username}
              </Link>
              <Link
                href={`/${user.username}`}
                className="text-gray-500 hover:underline block truncate"
              >
                @{user.username}
              </Link>
              {user.bio && <p className="text-gray-700 mt-2 line-clamp-2">{user.bio}</p>}
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>
                  <span className="font-semibold text-gray-900">{user.followers_count}</span>{' '}
                  followers
                </span>
                <span>
                  <span className="font-semibold text-gray-900">{user.following_count}</span>{' '}
                  following
                </span>
              </div>
            </div>

            <FollowButton username={user.username} isFollowing={user.isFollowing || false} />
          </div>
        </Card>
      ))}
    </div>
  )
}
