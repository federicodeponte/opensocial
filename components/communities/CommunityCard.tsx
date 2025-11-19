// ABOUTME: Community card component for discovery and lists
// ABOUTME: Shows community info, member count, type badge

'use client'

import Link from 'next/link'
import { Users, Lock, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Community } from '@/lib/types/community'

interface CommunityCardProps {
  community: Community
  showJoinButton?: boolean
  onJoin?: () => void
}

export function CommunityCard({ community, showJoinButton = true, onJoin }: CommunityCardProps) {
  const getTypeIcon = () => {
    switch (community.type) {
      case 'private':
        return <Lock className="h-4 w-4" />
      case 'secret':
        return <EyeOff className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTypeColor = () => {
    switch (community.type) {
      case 'private':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      case 'secret':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      {community.coverImage && (
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          <img
            src={community.coverImage}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {!community.coverImage && (
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {community.avatarUrl ? (
              <img
                src={community.avatarUrl}
                alt={community.name}
                className="w-12 h-12 rounded-full border-2 border-background -mt-8"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-background -mt-8">
                {community.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Type Badge */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}
            >
              {getTypeIcon()}
              <span className="capitalize">{community.type}</span>
            </div>
          </div>
        </div>

        {/* Name & Description */}
        <Link href={`/communities/${community.slug}`}>
          <h3 className="font-semibold text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {community.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {community.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {community.memberCount.toLocaleString()}{' '}
              {community.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
          <div>{community.postCount.toLocaleString()} posts</div>
        </div>

        {/* Join Button */}
        {showJoinButton && !community.isMember && (
          <Button
            onClick={onJoin}
            className="w-full mt-4"
            variant={community.type === 'public' ? 'default' : 'outline'}
          >
            {community.type === 'public' ? 'Join Community' : 'Request to Join'}
          </Button>
        )}

        {community.isMember && (
          <div className="mt-4 text-center text-sm text-green-600 dark:text-green-400 font-medium">
            ✓ Member
          </div>
        )}
      </div>
    </Card>
  )
}
