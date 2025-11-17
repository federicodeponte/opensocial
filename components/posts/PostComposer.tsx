'use client'

import { useState, useRef, useEffect } from 'react'
import { useCreatePost } from '@/lib/hooks/usePosts'
import { useCreatePoll } from '@/lib/hooks/usePolls'
import { useCreateScheduledPost } from '@/lib/hooks/useScheduledPosts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ImagePicker } from '@/components/posts/ImagePicker'
import { PollComposer, type PollData } from '@/components/posts/PollComposer'
import { MentionAutocomplete } from '@/components/posts/MentionAutocomplete'
import { GifPicker } from '@/components/posts/GifPicker'
import { extractMentions } from '@/lib/utils/mentionParser'
import { getGifUrl } from '@/lib/integrations/giphy-client'
import { BarChart3, Calendar, X, FileImage } from 'lucide-react'
import type { IGif } from '@giphy/js-types'

interface PostComposerProps {
  replyToId?: string
  replyToUsername?: string
  onSuccess?: () => void
}

export function PostComposer({ replyToId, replyToUsername, onSuccess }: PostComposerProps) {
  const [content, setContent] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [showPollComposer, setShowPollComposer] = useState(false)
  const [pollData, setPollData] = useState<PollData | null>(null)
  const [scheduledFor, setScheduledFor] = useState<string>('')
  const [showScheduler, setShowScheduler] = useState(false)
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [selectedGif, setSelectedGif] = useState<IGif | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const createPost = useCreatePost()
  const createPoll = useCreatePoll()
  const createScheduledPost = useCreateScheduledPost()

  // Detect @ symbol and show mention autocomplete
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const text = content.slice(0, cursorPosition)
    const lastAtSymbolIndex = text.lastIndexOf('@')

    if (lastAtSymbolIndex !== -1) {
      const textAfterAt = text.slice(lastAtSymbolIndex + 1)
      // Only show autocomplete if no space after @ and within 30 chars
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 30) {
        setMentionQuery(textAfterAt)
        setShowMentionAutocomplete(true)

        // Calculate position for autocomplete dropdown
        const rect = textarea.getBoundingClientRect()
        setMentionPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        })
      } else {
        setShowMentionAutocomplete(false)
      }
    } else {
      setShowMentionAutocomplete(false)
    }
  }, [content, cursorPosition])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }

  const handleMentionSelect = (username: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const text = content
    const beforeCursor = text.slice(0, cursorPosition)
    const afterCursor = text.slice(cursorPosition)
    const lastAtSymbolIndex = beforeCursor.lastIndexOf('@')

    if (lastAtSymbolIndex !== -1) {
      const newContent =
        beforeCursor.slice(0, lastAtSymbolIndex + 1) + username + ' ' + afterCursor
      setContent(newContent)
      setShowMentionAutocomplete(false)

      // Set cursor position after the inserted username
      setTimeout(() => {
        const newCursorPos = lastAtSymbolIndex + username.length + 2
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    }
  }

  const handleGifSelect = (gif: IGif) => {
    setSelectedGif(gif)
    setSelectedImages([]) // Clear images when GIF is selected
    setShowPollComposer(false) // Can't have poll with GIF
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && selectedImages.length === 0 && !selectedGif) return

    try {
      let imageUrls: string[] = []

      // If GIF is selected, use GIF URL
      if (selectedGif) {
        imageUrls = [getGifUrl(selectedGif)]
      }
      // Otherwise upload images if any
      else if (selectedImages.length > 0) {
        setUploading(true)

        // Generate temporary post ID for upload
        const tempPostId = crypto.randomUUID()

        const formData = new FormData()
        formData.append('postId', tempPostId)
        selectedImages.forEach((file, index) => {
          formData.append(`image${index}`, file)
        })

        const uploadResponse = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images')
        }

        const uploadData = await uploadResponse.json()
        imageUrls = uploadData.data.imageUrls
        setUploading(false)
      }

      // If scheduled, create scheduled post instead
      if (scheduledFor) {
        await createScheduledPost.mutateAsync({
          content,
          scheduledFor,
          imageUrls,
          replyToId,
        })
      } else {
        // Create post first
        const post = await createPost.mutateAsync({ content, replyToId, imageUrls })

        // Create poll if poll data exists
        if (pollData && pollData.options.length >= 2 && post.id) {
          await createPoll.mutateAsync({
            postId: post.id,
            options: pollData.options,
            expiresInHours: pollData.expiresInHours,
          })
        }

        // Create mentions if any exist in content
        const mentions = extractMentions(content)
        if (mentions.length > 0 && post.id) {
          await fetch('/api/mentions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post.id, content }),
          })
        }
      }

      setContent('')
      setSelectedImages([])
      setSelectedGif(null)
      setShowPollComposer(false)
      setPollData(null)
      setScheduledFor('')
      setShowScheduler(false)
      onSuccess?.()
    } catch {
      setUploading(false)
      // Error is already displayed via createPost.isError
      // No need to log - React Query handles error state
    }
  }

  const handlePollChange = (poll: PollData | null) => {
    setPollData(poll)
    if (poll === null) {
      setShowPollComposer(false)
    }
  }

  const charCount = content.length
  const maxChars = 280
  const remaining = maxChars - charCount
  const isOverLimit = remaining < 0

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {replyToUsername && (
          <div className="text-sm text-gray-600 pb-2 border-b">
            Replying to <span className="text-blue-600">@{replyToUsername}</span>
          </div>
        )}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            placeholder={replyToId ? "Post your reply..." : "What's happening?"}
            className="w-full min-h-[100px] text-lg resize-none border-none focus:outline-none focus:ring-0"
            disabled={createPost.isPending || uploading}
          />
          {showMentionAutocomplete && (
            <MentionAutocomplete
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentionAutocomplete(false)}
              position={mentionPosition}
            />
          )}
        </div>

        {/* Image Picker */}
        {!selectedGif && (
          <ImagePicker
            selectedImages={selectedImages}
            onImagesSelected={setSelectedImages}
          />
        )}

        {/* Selected GIF Preview */}
        {selectedGif && (
          <div className="relative">
            <img
              src={getGifUrl(selectedGif)}
              alt="Selected GIF"
              className="max-h-64 rounded-lg"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedGif(null)}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Poll Composer */}
        {showPollComposer && (
          <PollComposer
            onPollChange={handlePollChange}
            disabled={createPost.isPending || uploading}
          />
        )}

        {/* Scheduler */}
        {showScheduler && (
          <div className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Schedule Post</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowScheduler(false)
                  setScheduledFor('')
                }}
                disabled={createPost.isPending || uploading}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-border rounded-md"
            />
            {scheduledFor && (
              <p className="text-xs text-muted-foreground">
                Will be posted on{' '}
                {new Date(scheduledFor).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {/* GIF Button */}
            {!selectedGif && !showPollComposer && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowGifPicker(true)}
                disabled={createPost.isPending || uploading}
                className="gap-2"
              >
                <FileImage className="h-4 w-4" />
                GIF
              </Button>
            )}
            {/* Poll Button */}
            {!showPollComposer && !replyToId && !scheduledFor && !selectedGif && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPollComposer(true)}
                disabled={createPost.isPending || uploading}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Poll
              </Button>
            )}
            {/* Schedule Button */}
            {!showScheduler && !replyToId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowScheduler(true)}
                disabled={createPost.isPending || uploading}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Schedule
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`text-sm ${
                isOverLimit
                  ? 'text-red-600 font-semibold'
                  : remaining < 20
                  ? 'text-yellow-600'
                  : 'text-gray-500'
              }`}
            >
              {remaining} characters remaining
            </div>
            <Button
              type="submit"
              disabled={(!content.trim() && selectedImages.length === 0 && !selectedGif) || isOverLimit || createPost.isPending || uploading}
            >
              {uploading ? 'Uploading...' : createPost.isPending ? (replyToId ? 'Replying...' : 'Posting...') : (replyToId ? 'Reply' : 'Post')}
            </Button>
          </div>
        </div>
        {createPost.isError && (
          <div className="text-sm text-red-600">
            {createPost.error instanceof Error ? createPost.error.message : 'Failed to post'}
          </div>
        )}
      </form>

      {/* GIF Picker Modal */}
      {showGifPicker && (
        <GifPicker
          onSelect={handleGifSelect}
          onClose={() => setShowGifPicker(false)}
        />
      )}
    </Card>
  )
}
