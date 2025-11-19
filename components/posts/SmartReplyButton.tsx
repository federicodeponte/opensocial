// ABOUTME: Smart Reply button with AI-powered suggestions
// ABOUTME: Shows 3 contextual reply options when clicked

'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SmartReply {
  text: string
  tone: 'friendly' | 'professional' | 'funny' | 'supportive'
}

interface SmartReplyButtonProps {
  postId: string
  postContent: string
  authorName?: string
  onSelectReply: (reply: string) => void
}

export function SmartReplyButton({
  postId,
  postContent,
  authorName,
  onSelectReply,
}: SmartReplyButtonProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SmartReply[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleGenerateSuggestions = async () => {
    setLoading(true)
    setShowSuggestions(true)

    try {
      const response = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postContent,
          authorName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate suggestions')
      }

      const data = await response.json()
      setSuggestions(data.replies || [])
    } catch (error) {
      console.error('Smart reply error:', error)
      // Show fallback suggestions
      setSuggestions([
        { text: 'Thanks for sharing!', tone: 'friendly' },
        { text: 'Interesting perspective.', tone: 'professional' },
        { text: 'Love this!', tone: 'supportive' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectReply = (reply: SmartReply) => {
    onSelectReply(reply.text)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const getToneEmoji = (tone: SmartReply['tone']) => {
    switch (tone) {
      case 'friendly':
        return '😊'
      case 'professional':
        return '💼'
      case 'funny':
        return '😄'
      case 'supportive':
        return '💪'
      default:
        return '✨'
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleGenerateSuggestions}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        AI Replies
      </Button>

      {showSuggestions && (
        <div className="absolute left-0 top-full mt-2 w-80 rounded-lg border bg-white dark:bg-gray-800 shadow-lg z-10 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Smart Replies</span>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Generating suggestions...
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectReply(suggestion)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-blue-500"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getToneEmoji(suggestion.tone)}</span>
                    <div className="flex-1">
                      <p className="text-sm">{suggestion.text}</p>
                      <span className="text-xs text-gray-500 capitalize">{suggestion.tone}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 pt-2 border-t text-xs text-gray-500 text-center">
            Click a suggestion to use it, or edit as needed
          </div>
        </div>
      )}
    </div>
  )
}
