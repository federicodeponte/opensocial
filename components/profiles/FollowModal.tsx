// ABOUTME: Modal for displaying followers/following lists
// ABOUTME: Tabbed interface with follow/unfollow buttons

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFollowers, useFollowing } from '@/lib/hooks/useProfile'
import { FollowButton } from './FollowButton'

interface FollowModalProps {
  username: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: 'followers' | 'following'
}

export function FollowModal({ username, open, onOpenChange, initialTab = 'followers' }: FollowModalProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab)
  const { data: followers, isLoading: followersLoading } = useFollowers(username)
  const { data: following, isLoading: followingLoading } = useFollowing(username)

  const displayData = activeTab === 'followers' ? followers : following
  const isLoading = activeTab === 'followers' ? followersLoading : followingLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle>
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('followers')}
                className={`flex-1 py-3 font-semibold transition-colors relative ${
                  activeTab === 'followers'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Followers
                {activeTab === 'followers' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`flex-1 py-3 font-semibold transition-colors relative ${
                  activeTab === 'following'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Following
                {activeTab === 'following' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto max-h-[450px]">
          {isLoading ? (
            <div className="space-y-4 p-4">
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
          ) : !displayData || displayData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {activeTab} yet
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {displayData.map((follow) => {
                const profile = activeTab === 'followers' ? follow.follower_profile : follow.following_profile
                const profileId = activeTab === 'followers' ? follow.follower_id : follow.following_id

                if (!profile) return null

                return (
                  <div key={profileId} className="flex items-center justify-between py-2">
                    <a
                      href={`/${profile.username}`}
                      className="flex items-center gap-3 flex-1 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name || profile.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
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
                      className="ml-2"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
