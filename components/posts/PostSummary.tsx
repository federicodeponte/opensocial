// ABOUTME: Post summary component with AI-generated TL;DR
// ABOUTME: Shows concise summary for long posts

'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PostSummaryProps {
  postId: string
  content: string
  minLength?: number
}

export function PostSummary({ postId, content, minLength = 500 }: PostSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  // Only show summary button for long posts
  if (content.length < minLength) {
    return null
  }

  const handleGenerateSummary = async () => {
    setLoading(true)
    setShowSummary(true)

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type: 'tldr',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.tldr || null)
    } catch (error) {
      console.error('Summary generation error:', error)
      setSummary(content.substring(0, 100) + '...')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2">
      {!showSummary ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGenerateSummary}
          className="gap-2 text-blue-600 hover:text-blue-700"
        >
          <FileText className="h-4 w-4" />
          TL;DR
        </Button>
      ) : (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs font-semibold text-blue-600 uppercase">TL;DR</span>
              {loading ? (
                <div className="flex items-center gap-2 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-sm text-gray-600">Generating summary...</span>
                </div>
              ) : (
                <p className="text-sm mt-1">{summary}</p>
              )}
            </div>
            <button
              onClick={() => setShowSummary(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
