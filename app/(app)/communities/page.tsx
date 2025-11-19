// ABOUTME: Communities discovery page
// ABOUTME: Search, filter, create, browse all communities

'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommunityCard } from '@/components/communities/CommunityCard'
import { CreateCommunityModal } from '@/components/communities/CreateCommunityModal'
import { useCommunities, useJoinCommunity } from '@/lib/hooks/useCommunities'
import type { CommunityType } from '@/lib/types/community'

export default function CommunitiesPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<CommunityType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'members'>('popular')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock user ID (in real app, get from auth)
  const userId = 'mock-user-id'

  const { data: communities, isLoading } = useCommunities({
    search: search || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    sort: sortBy,
    limit: 50,
  })

  const joinCommunity = useJoinCommunity()

  const handleJoin = (communityId: string) => {
    joinCommunity.mutate({ communityId, userId })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Communities</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Type:</span>
              <div className="flex gap-2">
                {['all', 'public', 'private', 'secret'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type as CommunityType | 'all')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      typeFilter === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'members')}
                className="px-3 py-1 border border-border rounded-lg bg-background text-sm"
              >
                <option value="popular">Most Popular</option>
                <option value="members">Most Members</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="text-muted-foreground mt-4">Loading communities...</p>
          </div>
        )}

        {!isLoading && communities && communities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏘️</div>
            <h3 className="text-xl font-semibold mb-2">No communities found</h3>
            <p className="text-muted-foreground mb-6">
              {search
                ? 'Try a different search term'
                : 'Be the first to create a community!'}
            </p>
            {!search && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            )}
          </div>
        )}

        {!isLoading && communities && communities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                onJoin={() => handleJoin(community.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateCommunityModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userId={userId}
      />
    </div>
  )
}
