// ABOUTME: Follow/Unfollow button component for user profiles
// ABOUTME: Handles follow state and mutations with optimistic updates

'use client'

import { Button } from '@/components/ui/button'
import { useFollowUser, useUnfollowUser } from '@/lib/hooks/useProfile'
import { useState } from 'react'

interface FollowButtonProps {
  username: string
  isFollowing: boolean
  isOwnProfile?: boolean
  className?: string
}

export function FollowButton({
  username,
  isFollowing: initialIsFollowing,
  isOwnProfile = false,
  className,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const followUser = useFollowUser()
  const unfollowUser = useUnfollowUser()

  if (isOwnProfile) {
    return null
  }

  const handleClick = async () => {
    try {
      // Optimistic update
      setIsFollowing(!isFollowing)

      if (isFollowing) {
        await unfollowUser.mutateAsync(username)
      } else {
        await followUser.mutateAsync(username)
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(isFollowing)
      console.error('Follow action failed:', error)
    }
  }

  const isLoading = followUser.isPending || unfollowUser.isPending

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={isFollowing ? 'outline' : 'default'}
      className={className}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  )
}
