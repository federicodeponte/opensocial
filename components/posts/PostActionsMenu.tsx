// ABOUTME: Dropdown menu for post actions (pin, delete, report, etc.)
// ABOUTME: Shows different options based on post ownership

'use client'

import { useState } from 'react'
import { Pin, Trash2, MoreHorizontal, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTogglePin } from '@/lib/hooks/usePinPost'
import { ReportDialog } from '@/components/reports/ReportDialog'

interface PostActionsMenuProps {
  postId: string
  isOwnPost: boolean
  isPinned: boolean
  onDelete?: () => void
}

export function PostActionsMenu({
  postId,
  isOwnPost,
  isPinned,
  onDelete,
}: PostActionsMenuProps) {
  const togglePin = useTogglePin()
  const [showReportDialog, setShowReportDialog] = useState(false)

  const handlePin = async () => {
    await togglePin.mutateAsync({ postId, isPinned })
  }

  const handleDelete = () => {
    onDelete?.()
  }

  const handleReport = () => {
    setShowReportDialog(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwnPost ? (
            <>
              <DropdownMenuItem onClick={handlePin} disabled={togglePin.isPending}>
                <Pin className="h-4 w-4 mr-2" />
                {isPinned ? 'Unpin from profile' : 'Pin to profile'}
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="text-red-600">Delete post</span>
                </DropdownMenuItem>
              )}
            </>
          ) : (
            <DropdownMenuItem onClick={handleReport}>
              <Flag className="h-4 w-4 mr-2" />
              Report post
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showReportDialog && (
        <ReportDialog
          reportedPostId={postId}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </>
  )
}
