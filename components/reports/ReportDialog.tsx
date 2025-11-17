// ABOUTME: Dialog for reporting posts or users
// ABOUTME: Allows users to select reason and provide description

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCreateReport, ReportReason } from '@/lib/hooks/useReports'

interface ReportDialogProps {
  reportedPostId?: string
  reportedUserId?: string
  reportedUsername?: string
  onClose: () => void
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'spam', label: 'Spam', description: 'Unsolicited or repetitive content' },
  { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or targeted abuse' },
  { value: 'hate_speech', label: 'Hate Speech', description: 'Content promoting hate based on identity' },
  { value: 'violence', label: 'Violence', description: 'Graphic violence or threats' },
  { value: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
  { value: 'nsfw', label: 'NSFW', description: 'Adult content or nudity' },
  { value: 'other', label: 'Other', description: 'Other violations' },
]

export function ReportDialog({ reportedPostId, reportedUserId, reportedUsername, onClose }: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const createReport = useCreateReport()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) return

    try {
      await createReport.mutateAsync({
        reportedPostId,
        reportedUserId,
        reason: selectedReason,
        description: description.trim() || undefined,
      })
      onClose()
    } catch (error) {
      // Error is already displayed via createReport.isError
    }
  }

  const reportTarget = reportedPostId ? 'post' : reportedUsername ? `@${reportedUsername}` : 'user'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">Report {reportTarget}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Help us understand what's happening
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={createReport.isPending}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3">
                Why are you reporting this {reportedPostId ? 'post' : 'user'}?
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => setSelectedReason(reason.value)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedReason === reason.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    disabled={createReport.isPending}
                  >
                    <div className="font-semibold text-sm">{reason.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{reason.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description (optional) */}
            {selectedReason && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-semibold mb-2">
                  Additional details {selectedReason === 'other' ? '(required)' : '(optional)'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional context that might help us review this report..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  maxLength={500}
                  required={selectedReason === 'other'}
                  disabled={createReport.isPending}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {description.length}/500
                </div>
              </div>
            )}

            {/* Error Message */}
            {createReport.isError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {createReport.error instanceof Error ? createReport.error.message : 'Failed to submit report'}
              </div>
            )}

            {/* Success Message */}
            {createReport.isSuccess && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                Thank you for your report. We'll review it shortly.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createReport.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedReason || createReport.isPending || (selectedReason === 'other' && !description.trim())}
                className="flex-1"
              >
                {createReport.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
