// ABOUTME: Autocomplete dropdown for @mentions in post composer
// ABOUTME: Shows user suggestions with avatars when typing @ symbol

'use client'

import { useState, useEffect, useRef } from 'react'
import { getMentionSuggestions } from '@/lib/utils/mentionParser'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

interface MentionAutocompleteProps {
  /**
   * The partial username being typed (without @ symbol)
   */
  query: string
  /**
   * Callback when user selects a mention
   */
  onSelect: (username: string) => void
  /**
   * Callback when autocomplete should close
   */
  onClose: () => void
  /**
   * Position of the autocomplete dropdown
   */
  position: { top: number; left: number }
}

interface MentionSuggestion {
  username: string
  display_name: string | null
  avatar_url: string | null
  verified?: boolean
}

export function MentionAutocomplete({ query, onSelect, onClose, position }: MentionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const results = await getMentionSuggestions(query, 5)
        setSuggestions(results)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Failed to fetch mention suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [query])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % suggestions.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex].username)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [suggestions, selectedIndex, onSelect, onClose])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (query.length < 2) return null

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {isLoading ? (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Loading suggestions...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No users found
        </div>
      ) : (
        <ul className="py-1">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.username}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => onSelect(suggestion.username)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={suggestion.avatar_url || undefined} alt={suggestion.username} />
                  <AvatarFallback>
                    {suggestion.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {suggestion.display_name || suggestion.username}
                    </p>
                    {suggestion.verified && <VerifiedBadge size="sm" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{suggestion.username}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ↑↓ Navigate • Enter Select • Esc Close
        </p>
      </div>
    </div>
  )
}
