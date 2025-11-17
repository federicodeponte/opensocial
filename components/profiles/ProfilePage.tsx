// ABOUTME: Complete profile page component with posts feed
// ABOUTME: Displays user profile info and their posts

'use client'

import { useState } from 'react'
import { useProfile } from '@/lib/hooks/useProfile'
import { usePosts } from '@/lib/hooks/usePosts'
import { PostCard } from '@/components/posts/PostCard'
import { ProfileTabs } from './ProfileTabs'
import { EditProfileModal } from './EditProfileModal'
import { ProfileSkeleton } from './ProfileSkeleton'
import { FollowButton } from './FollowButton'
import { FollowModal } from './FollowModal'
import { ProfileActionsMenu } from './ProfileActionsMenu'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCreateConversation } from '@/lib/hooks/useMessages'

interface ProfilePageProps {
  username: string
}

export function ProfilePage({ username }: ProfilePageProps) {
  const router = useRouter()
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile(username)
  const { data: posts, isLoading: postsLoading } = usePosts()
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'likes'>('posts')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [followModalOpen, setFollowModalOpen] = useState(false)
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers')
  const createConversation = useCreateConversation()

  const handleMessageClick = async () => {
    if (!profile?.id) return
    try {
      const conversation = await createConversation.mutateAsync(profile.id)
      router.push(`/messages/${conversation.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  if (profileLoading) {
    return <ProfileSkeleton />
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">
              The profile you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/home">
              <Button>Go to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Filter posts based on active tab
  const userPosts = posts?.filter(post => post.profiles?.username === username) || []
  const filteredPosts = userPosts.filter(post => {
    switch (activeTab) {
      case 'posts':
        return !post.reply_to_id // Only original posts, not replies
      case 'replies':
        return !!post.reply_to_id // Only replies
      case 'media':
        return post.image_urls && post.image_urls.length > 0 // Only posts with images
      case 'likes':
        return false // TODO: Implement liked posts
      default:
        return true
    }
  })

  // Find pinned post and move to top (only on Posts tab)
  const pinnedPostId = profile?.pinned_post_id
  let displayPosts = filteredPosts
  if (activeTab === 'posts' && pinnedPostId) {
    const pinnedPost = filteredPosts.find(post => post.id === pinnedPostId)
    const otherPosts = filteredPosts.filter(post => post.id !== pinnedPostId)
    displayPosts = pinnedPost ? [pinnedPost, ...otherPosts] : filteredPosts
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Header Image */}
        {profile.header_url && (
          <div className="h-48 bg-gray-200 overflow-hidden">
            <img
              src={profile.header_url}
              alt="Profile header"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        {!profile.header_url && (
          <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600" />
        )}

        <div className="px-4">
          {/* Profile Info Section */}
          <div className="relative">
            {/* Avatar */}
            <div className="absolute -top-16 left-0 transition-transform duration-300 hover:scale-110">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-blue-500 flex items-center justify-center text-white text-4xl font-semibold shadow-lg">
                  {(profile.display_name?.[0] || profile.username[0]).toUpperCase()}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end gap-2">
              {profile.isOwnProfile ? (
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(true)}
                  className="transition-all duration-200 hover:bg-gray-100 hover:shadow-md"
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleMessageClick}
                    disabled={createConversation.isPending}
                    className="transition-all duration-200 hover:bg-gray-100 hover:shadow-md"
                  >
                    {createConversation.isPending ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Message'
                    )}
                  </Button>
                  <FollowButton
                    username={profile.username}
                    isFollowing={profile.isFollowing || false}
                    isOwnProfile={profile.isOwnProfile}
                    className="transition-all duration-200 hover:shadow-md"
                  />
                  <ProfileActionsMenu
                    username={profile.username}
                    userId={profile.id}
                    isMuted={profile.isMuted}
                    isBlocked={profile.isBlocked}
                  />
                </>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="mt-20 mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {profile.display_name || profile.username}
              </h1>
              {profile.verified && <VerifiedBadge size="lg" />}
            </div>
            <p className="text-gray-500">@{profile.username}</p>

            {profile.bio && (
              <p className="mt-3 text-gray-900 whitespace-pre-wrap">{profile.bio}</p>
            )}

            {(profile.location || profile.website) && (
              <div className="mt-3 flex gap-4 text-sm text-gray-600">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profile.location}
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            )}

            <div className="mt-3 flex gap-4 text-sm">
              <button
                onClick={() => {
                  setFollowModalTab('following')
                  setFollowModalOpen(true)
                }}
                className="hover:underline transition-all duration-200 cursor-pointer"
              >
                <span className="font-bold text-gray-900">{profile.following_count}</span>{' '}
                <span className="text-gray-600">Following</span>
              </button>
              <button
                onClick={() => {
                  setFollowModalTab('followers')
                  setFollowModalOpen(true)
                }}
                className="hover:underline transition-all duration-200 cursor-pointer"
              >
                <span className="font-bold text-gray-900">{profile.followers_count}</span>{' '}
                <span className="text-gray-600">Followers</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Posts Section */}
          <div className="mt-6 mb-8">
            {postsLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-gray-600">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading posts...
                </div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {activeTab === 'posts' ? 'posts' : activeTab} yet
              </div>
            ) : (
              <div className="space-y-4">
                {displayPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="animate-fadeIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {post.id === pinnedPostId && activeTab === 'posts' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 ml-4">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78.409 1.561 1.237 1.561h9.162c.828 0 1.487-.78 1.237-1.561L15 10.274V14a1 1 0 01-1 1H6a1 1 0 01-1-1v-3.726z" />
                        </svg>
                        <span className="font-semibold">Pinned Post</span>
                      </div>
                    )}
                    <PostCard post={post} isPinned={post.id === pinnedPostId && activeTab === 'posts'} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {profile.isOwnProfile && (
        <EditProfileModal
          profile={profile}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
        />
      )}

      {/* Follow Modal */}
      <FollowModal
        username={username}
        open={followModalOpen}
        onOpenChange={setFollowModalOpen}
        initialTab={followModalTab}
      />
    </div>
  )
}
