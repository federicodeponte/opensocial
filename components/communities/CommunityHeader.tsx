// ABOUTME: Community header with cover image, actions, and stats
// ABOUTME: Join/leave buttons, settings, member management

'use client'

import { Users, Settings, UserPlus, LogOut, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Community } from '@/lib/types/community'

interface CommunityHeaderProps {
  community: Community
  isMember: boolean
  isAdmin: boolean
  onJoin?: () => void
  onLeave?: () => void
  onSettings?: () => void
  onInvite?: () => void
  onManageMembers?: () => void
}

export function CommunityHeader({
  community,
  isMember,
  isAdmin,
  onJoin,
  onLeave,
  onSettings,
  onInvite,
  onManageMembers,
}: CommunityHeaderProps) {
  return (
    <div className="bg-background border-b">
      {/* Cover Image */}
      <div className="relative">
        {community.coverImage ? (
          <div className="h-48 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600">
            <img
              src={community.coverImage}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600" />
        )}
      </div>

      {/* Info Section */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {community.avatarUrl ? (
              <img
                src={community.avatarUrl}
                alt={community.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-background shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-background shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                {community.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & Stats */}
          <div className="flex-1 min-w-0 pb-4">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{community.name}</h1>
            <p className="text-muted-foreground mt-1">@{community.slug}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {community.memberCount.toLocaleString()}{' '}
                  {community.memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
              <div>{community.postCount.toLocaleString()} posts</div>
              <div className="capitalize px-2 py-0.5 bg-secondary rounded-full text-xs">
                {community.type}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pb-4">
            {!isMember && (
              <Button onClick={onJoin} size="lg">
                <UserPlus className="h-4 w-4 mr-2" />
                {community.type === 'public' ? 'Join' : 'Request to Join'}
              </Button>
            )}

            {isMember && !isAdmin && (
              <Button onClick={onLeave} variant="outline" size="lg">
                <LogOut className="h-4 w-4 mr-2" />
                Leave
              </Button>
            )}

            {isAdmin && (
              <>
                <Button onClick={onInvite} variant="outline" size="lg">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onSettings}>
                      <Settings className="h-4 w-4 mr-2" />
                      Community Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onManageMembers}>
                      <Shield className="h-4 w-4 mr-2" />
                      Manage Members
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="pb-4">
          <p className="text-muted-foreground">{community.description}</p>
        </div>
      </div>
    </div>
  )
}
