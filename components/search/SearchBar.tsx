// ABOUTME: Search bar component with live search results dropdown
// ABOUTME: Includes recent search history stored in localStorage

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSearchUsers } from '@/lib/hooks/useSearch'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const RECENT_SEARCHES_KEY = 'opensocial_recent_searches'
const MAX_RECENT_SEARCHES = 5

interface RecentSearch {
  username: string
  displayName: string | null
  timestamp: number
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { data: searchResults, isLoading } = useSearchUsers({
    query,
    limit: 5,
  })

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addToRecentSearches = (username: string, displayName: string | null) => {
    const newSearch: RecentSearch = {
      username,
      displayName,
      timestamp: Date.now(),
    }

    const updated = [
      newSearch,
      ...recentSearches.filter((s) => s.username !== username),
    ].slice(0, MAX_RECENT_SEARCHES)

    setRecentSearches(updated)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  }

  const handleSelectUser = (username: string, displayName: string | null) => {
    addToRecentSearches(username, displayName)
    setQuery('')
    setShowResults(false)
    router.push(`/${username}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowResults(false)
    }
  }

  const showRecent = showResults && query.trim().length === 0 && recentSearches.length > 0
  const showSearchResults = showResults && query.trim().length >= 2

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          className="w-full"
        />
      </form>

      {/* Dropdown */}
      {(showRecent || showSearchResults) && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50">
          {/* Recent searches */}
          {showRecent && (
            <div className="p-2">
              <div className="px-3 py-2 text-sm text-gray-500 font-medium">
                Recent searches
              </div>
              {recentSearches.map((search) => (
                <button
                  key={search.username}
                  onClick={() => handleSelectUser(search.username, search.displayName)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {(search.displayName?.[0] || search.username[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {search.displayName || search.username}
                    </div>
                    <div className="text-gray-500 text-sm truncate">@{search.username}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          {showSearchResults && (
            <div className="p-2">
              {isLoading && (
                <div className="px-3 py-8 text-center text-gray-500">
                  Searching...
                </div>
              )}

              {!isLoading && searchResults && searchResults.length === 0 && (
                <div className="px-3 py-8 text-center text-gray-500">
                  No users found for &quot;{query}&quot;
                </div>
              )}

              {!isLoading && searchResults && searchResults.length > 0 && (
                <>
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user.username, user.display_name)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {(user.display_name?.[0] || user.username[0]).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {user.display_name || user.username}
                        </div>
                        <div className="text-gray-500 text-sm truncate">@{user.username}</div>
                      </div>
                    </button>
                  ))}
                  <Link
                    href={`/search?q=${encodeURIComponent(query.trim())}`}
                    onClick={() => setShowResults(false)}
                    className="block px-3 py-2 text-center text-blue-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium mt-1"
                  >
                    See all results for &quot;{query}&quot;
                  </Link>
                </>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
