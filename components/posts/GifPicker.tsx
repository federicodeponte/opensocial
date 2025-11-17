// ABOUTME: GIF picker modal component using Giphy API
// ABOUTME: Allows users to search and select GIFs for posts

'use client'

import { useState, useEffect } from 'react'
import { Grid } from '@giphy/react-components'
import { searchGifs, getTrendingGifs, giphyClient } from '@/lib/integrations/giphy-client'
import { Button } from '@/components/ui/button'
import { X, Search } from 'lucide-react'
import type { IGif } from '@giphy/js-types'

interface GifPickerProps {
  /**
   * Callback when user selects a GIF
   */
  onSelect: (gif: IGif) => void
  /**
   * Callback when modal should close
   */
  onClose: () => void
}

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Fetch function for the Grid component
  const fetchGifs = async (offset: number) => {
    if (searchQuery.trim()) {
      return await searchGifs(searchQuery, 20, offset)
    } else {
      return await getTrendingGifs(20, offset)
    }
  }

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setIsSearching(true)
  }

  const handleGifClick = (gif: IGif, e: React.SyntheticEvent) => {
    e.preventDefault()
    onSelect(gif)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Choose a GIF
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for GIFs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {searchQuery
              ? `Searching for "${searchQuery}"...`
              : 'Trending GIFs - Powered by GIPHY'}
          </p>
        </div>

        {/* GIF Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isSearching && (
            <Grid
              key={searchQuery} // Re-render when search changes
              width={720}
              columns={3}
              gutter={8}
              fetchGifs={fetchGifs}
              onGifClick={handleGifClick}
              noLink={true}
              hideAttribution={false}
            />
          )}
          {isSearching && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Powered by{' '}
            <a
              href="https://giphy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GIPHY
            </a>
          </p>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
