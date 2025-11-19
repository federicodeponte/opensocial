// ABOUTME: Hashtag suggestions component with AI
// ABOUTME: Suggests relevant hashtags as user types

'use client'

import { useState, useEffect } from 'react'
import { Hash, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HashtagSuggestion {
  hashtag: string
  relevance: number
  category: 'trending' | 'topical' | 'niche'
}

interface HashtagSuggestionsProps {
  content: string
  onSelectHashtag: (hashtag: string) => void
  maxSuggestions?: number
}

export function HashtagSuggestions({
  content,
  onSelectHashtag,
  maxSuggestions = 5,
}: HashtagSuggestionsProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<HashtagSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleGenerateSuggestions = async () => {
    if (!content || content.trim().length < 10) {
      return
    }

    setLoading(true)
    setShowSuggestions(true)

    try {
      const response = await fetch('/api/ai/suggest-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          count: maxSuggestions,
          type: 'complementary', // Only suggest hashtags not already in content
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate hashtags')
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Hashtag suggestion error:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: HashtagSuggestion['category']) => {
    switch (category) {
      case 'trending':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      case 'topical':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'niche':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getCategoryIcon = (category: HashtagSuggestion['category']) => {
    switch (category) {
      case 'trending':
        return '🔥'
      case 'topical':
        return '💡'
      case 'niche':
        return '🎯'
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
        disabled={loading || content.trim().length < 10}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Hash className="h-4 w-4" />
        )}
        Suggest Hashtags
      </Button>

      {showSuggestions && (
        <div className="absolute left-0 top-full mt-2 w-80 rounded-lg border bg-white dark:bg-gray-800 shadow-lg z-10 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Hashtag Suggestions</span>
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
              Finding relevant hashtags...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">
              No hashtag suggestions available
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelectHashtag(suggestion.hashtag)
                    // Remove from suggestions after selection
                    setSuggestions((prev) => prev.filter((_, i) => i !== index))
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{getCategoryIcon(suggestion.category)}</span>
                      <span className="font-medium">{suggestion.hashtag}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${getCategoryColor(
                          suggestion.category
                        )}`}
                      >
                        {suggestion.category}
                      </span>
                      <span className="text-xs text-gray-500">{suggestion.relevance}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 pt-2 border-t text-xs text-gray-500 text-center">
            Click to add hashtag to your post
          </div>
        </div>
      )}
    </div>
  )
}
