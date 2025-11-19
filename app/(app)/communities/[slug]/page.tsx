// ABOUTME: Individual community page
// ABOUTME: Posts feed, events, members, moderation

'use client'

import { useState } from 'react'
import { CommunityHeader } from '@/components/communities/CommunityHeader'
import { PostComposer } from '@/components/posts/PostComposer'
import { PostCard } from '@/components/posts/PostCard'
import {
  useCommunityBySlug,
  useCommunityPosts,
  useCommunityEvents,
  useJoinCommunity,
  useLeaveCommunity,
  useMemberRole,
  useCreateCommunityPost,
} from '@/lib/hooks/useCommunities'
import { Calendar, Users as UsersIcon, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CommunityPageProps {
  params: {
    slug: string
  }
}

export default function CommunityPage({ params }: CommunityPageProps) {
  const { slug } = params
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'members'>('posts')

  // Mock user ID (in real app, get from auth)
  const userId = 'mock-user-id'

  const { data: community, isLoading: communityLoading } = useCommunityBySlug(slug)
  const communityId = community && 'id' in community ? community.id : ''
  const { data: memberRole } = useMemberRole(communityId, userId)
  const { data: postsData, fetchNextPage, hasNextPage } = useCommunityPosts(
    communityId,
    userId
  )
  const { data: events } = useCommunityEvents(communityId)

  const joinCommunity = useJoinCommunity()
  const leaveCommunity = useLeaveCommunity()
  const createPost = useCreateCommunityPost()

  const isMember = memberRole && 'status' in memberRole && memberRole.status === 'active'
  const isAdmin = memberRole && 'role' in memberRole && ['owner', 'admin'].includes(memberRole.role as string)

  const handleJoin = () => {
    if (communityId) {
      joinCommunity.mutate({ communityId, userId })
    }
  }

  const handleLeave = () => {
    if (communityId) {
      leaveCommunity.mutate({ communityId, userId })
    }
  }

  const handleCreatePost = async (content: string) => {
    if (communityId) {
      await createPost.mutateAsync({ communityId, userId, content })
    }
  }

  if (communityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!community || !('id' in community)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏘️</div>
          <h2 className="text-2xl font-bold mb-2">Community not found</h2>
          <p className="text-muted-foreground">This community doesn't exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  const posts = postsData?.pages.flatMap((page) => page) || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <CommunityHeader
        community={community as any}
        isMember={isMember}
        isAdmin={isAdmin || false}
        onJoin={handleJoin}
        onLeave={handleLeave}
      />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Posts
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'events'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Events
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'members'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UsersIcon className="h-4 w-4 inline mr-2" />
                Members
              </button>
            </div>

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                {/* Post Composer */}
                {isMember && (
                  <div className="mb-6">
                    <PostComposer
                      onPost={handleCreatePost}
                      placeholder={`Share with ${('name' in community && community.name) || 'this community'}...`}
                    />
                  </div>
                )}

                {/* Posts Feed */}
                {posts.length === 0 && (
                  <Card className="p-12 text-center">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground">
                      {isMember
                        ? 'Be the first to post in this community!'
                        : 'Join the community to see and create posts'}
                    </p>
                  </Card>
                )}

                {posts.map((post) => (
                  <div key={post.id} className="mb-4">
                    <PostCard post={post} />
                  </div>
                ))}

                {hasNextPage && (
                  <Button
                    onClick={() => fetchNextPage()}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    Load More
                  </Button>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                {events && events.length === 0 && (
                  <Card className="p-12 text-center">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="font-semibold mb-2">No upcoming events</h3>
                    <p className="text-muted-foreground">
                      Check back later for community events
                    </p>
                  </Card>
                )}

                {events?.map((event) => (
                  <Card key={event.id} className="p-6 mb-4">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <p className="text-muted-foreground mt-2">{event.description}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm">
                      <div>
                        📅 {new Date(event.startTime).toLocaleDateString()} at{' '}
                        {new Date(event.startTime).toLocaleTimeString()}
                      </div>
                      {event.isOnline && <div>🌐 Online</div>}
                      {event.location && <div>📍 {event.location}</div>}
                      <div className="ml-auto">
                        👥 {event.attendeeCount}{' '}
                        {event.attendeeCount === 1 ? 'attendee' : 'attendees'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <Card className="p-12 text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="font-semibold mb-2">Members list coming soon</h3>
                <p className="text-muted-foreground">
                  View all {community.memberCount} members of this community
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* About */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">About</h3>
              <p className="text-sm text-muted-foreground">{('description' in community && community.description) || ''}</p>
            </Card>

            {/* Stats */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Community Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-medium">{('member_count' in community && community.member_count?.toLocaleString()) || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posts</span>
                  <span className="font-medium">{('post_count' in community && community.post_count?.toLocaleString()) || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {('created_at' in community && community.created_at) ? new Date(community.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            </Card>

            {/* Upcoming Events */}
            {events && events.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Upcoming Events</h3>
                <div className="space-y-3">
                  {events.slice(0, 3).map((event) => (
                    <div key={event.id} className="text-sm">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-muted-foreground">
                        {new Date(event.startTime).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
