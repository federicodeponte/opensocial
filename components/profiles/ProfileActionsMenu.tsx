// ABOUTME: Dropdown menu for profile actions (mute, block, report)
// ABOUTME: Provides mute, block, and report functionality for user profiles

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, UserX, VolumeX, Volume2, UserCheck, Flag } from 'lucide-react'
import { useMuteUser, useUnmuteUser, useBlockUser, useUnblockUser } from '@/lib/hooks/useMuteBlock'
import { ReportDialog } from '@/components/reports/ReportDialog'

interface ProfileActionsMenuProps {
  username: string
  userId: string
  isMuted?: boolean
  isBlocked?: boolean
}

export function ProfileActionsMenu({ username, userId, isMuted = false, isBlocked = false }: ProfileActionsMenuProps) {
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const muteUser = useMuteUser()
  const unmuteUser = useUnmuteUser()
  const blockUser = useBlockUser()
  const unblockUser = useUnblockUser()

  const handleMute = async () => {
    if (isMuted) {
      await unmuteUser.mutateAsync(username)
    } else {
      await muteUser.mutateAsync(username)
    }
  }

  const handleBlock = async () => {
    if (isBlocked) {
      await unblockUser.mutateAsync(username)
      setShowBlockConfirm(false)
    } else {
      if (!showBlockConfirm) {
        setShowBlockConfirm(true)
        return
      }
      await blockUser.mutateAsync(username)
      setShowBlockConfirm(false)
    }
  }

  const handleReport = () => {
    setShowReportDialog(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Mute/Unmute */}
          <DropdownMenuItem onClick={handleMute} disabled={muteUser.isPending || unmuteUser.isPending}>
            {isMuted ? (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Unmute @{username}
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 mr-2" />
                Mute @{username}
              </>
            )}
          </DropdownMenuItem>

          {/* Block/Unblock */}
          <DropdownMenuItem
            onClick={handleBlock}
            disabled={blockUser.isPending || unblockUser.isPending}
          >
            {isBlocked ? (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Unblock @{username}
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Block @{username}
              </>
            )}
          </DropdownMenuItem>

          {/* Report */}
          <DropdownMenuItem onClick={handleReport}>
            <Flag className="h-4 w-4 mr-2" />
            Report @{username}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report Dialog */}
      {showReportDialog && (
        <ReportDialog
          reportedUserId={userId}
          reportedUsername={username}
          onClose={() => setShowReportDialog(false)}
        />
      )}

      {/* Block Confirmation Dialog */}
      {showBlockConfirm && !isBlocked && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-2">Block @{username}?</h3>
            <p className="text-gray-600 mb-4">
              They won't be able to follow you or see your posts, and you won't see posts from them.
              This will also remove any existing follows between you.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBlockConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBlock}
                disabled={blockUser.isPending}
              >
                {blockUser.isPending ? 'Blocking...' : 'Block'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
