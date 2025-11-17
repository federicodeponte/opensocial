// ABOUTME: Complete profile page component with posts feed
// ABOUTME: Displays user profile info and their posts

'use client'

import { useProfile } from '@/lib/hooks/useProfile'
import { usePosts } from '@/lib/hooks/usePosts'
import { ProfileCard } from './ProfileCard'
import { PostCard } from '@/components/posts/PostCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ProfilePageProps {
  username: string
}

export function ProfilePage({ username }: ProfilePageProps) {
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile(username)
  const { data: posts, isLoading: postsLoading } = usePosts()

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">
              The profile you're looking for doesn't exist.
            </p>
            <Link href="/home">
              <Button>Go to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Filter posts by this user
  const userPosts = posts?.filter(post => post.profiles?.username === username) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/home">
            <Button variant="outline">← Back to Home</Button>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="mb-8">
          <ProfileCard profile={profile} />
        </div>

        {/* Posts Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Posts</h2>

          {postsLoading ? (
            <div className="text-center py-8 text-gray-600">Loading posts...</div>
          ) : userPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No posts yet
            </div>
          ) : (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
