// ABOUTME: Advanced search with tabs and filters
// ABOUTME: Search users, posts, and hashtags with filter options

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSearchUsers, useSearchPosts } from '@/lib/hooks/useSearch'
import { PostCard } from '@/components/posts/PostCard'
import Link from 'next/link'
import { FollowButton } from '@/components/profiles/FollowButton'
import { Filter } from 'lucide-react'

interface AdvancedSearchClientProps {
  query: string
}

type SearchTab = 'users' | 'posts' | 'hashtags'

export default function AdvancedSearchClient({ query }: AdvancedSearchClientProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>('posts')
  const [hasMedia, setHasMedia] = useState(false)
  const [fromUser, setFromUser] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const { data: users, isLoading: usersLoading } = useSearchUsers({ query, limit: 20 })
  const { data: posts, isLoading: postsLoading } = useSearchPosts({
    query,
    limit: 20,
    hasMedia,
    fromUser: fromUser || undefined
  })

  const tabs: { id: SearchTab; label: string; count?: number }[] = [
    { id: 'posts', label: 'Posts', count: posts?.length },
    { id: 'users', label: 'Users', count: users?.length },
    { id: 'hashtags', label: 'Hashtags', count: 0 },
  ]

  const isLoading = activeTab === 'users' ? usersLoading : postsLoading

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 text-sm text-gray-500">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'posts' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        )}
      </div>

      {/* Filters (Posts only) */}
      {activeTab === 'posts' && showFilters && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Filter Posts</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasMedia"
                checked={hasMedia}
                onChange={(e) => setHasMedia(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasMedia" className="text-sm font-medium text-gray-700">
                Only show posts with media
              </label>
            </div>
            <div>
              <label htmlFor="fromUser" className="block text-sm font-medium text-gray-700 mb-1">
                From user (username)
              </label>
              <input
                type="text"
                id="fromUser"
                value={fromUser}
                onChange={(e) => setFromUser(e.target.value)}
                placeholder="e.g., johndoe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-20 bg-gray-200 rounded" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !query && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Search OpenSocial</h3>
            <p className="text-sm text-gray-500">Find users, posts, and hashtags</p>
          </div>
        </Card>
      )}

      {/* No results */}
      {!isLoading && query && activeTab === 'posts' && (!posts || posts.length === 0) && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No posts found</h3>
            <p className="text-sm text-gray-500">
              Try searching for different keywords or adjust your filters
            </p>
          </div>
        </Card>
      )}

      {!isLoading && query && activeTab === 'users' && (!users || users.length === 0) && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-sm text-gray-500">
              Try searching for different keywords
            </p>
          </div>
        </Card>
      )}

      {/* Posts Results */}
      {!isLoading && activeTab === 'posts' && posts && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Users Results */}
      {!isLoading && activeTab === 'users' && users && users.length > 0 && (
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
      )}

      {/* Hashtags Results */}
      {!isLoading && activeTab === 'hashtags' && (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Hashtag search coming soon</h3>
            <p className="text-sm text-gray-500">
              This feature will be available in a future update
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
