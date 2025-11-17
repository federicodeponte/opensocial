// ABOUTME: Profile tabs component for filtering user content
// ABOUTME: Shows Posts, Replies, Media, and Likes tabs

'use client'

import { useState } from 'react'

type TabType = 'posts' | 'replies' | 'media' | 'likes'

interface ProfileTabsProps {
  onTabChange: (tab: TabType) => void
  activeTab?: TabType
}

export function ProfileTabs({ onTabChange, activeTab = 'posts' }: ProfileTabsProps) {
  const [currentTab, setCurrentTab] = useState<TabType>(activeTab)

  const tabs: { id: TabType; label: string }[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'replies', label: 'Replies' },
    { id: 'media', label: 'Media' },
    { id: 'likes', label: 'Likes' },
  ]

  const handleTabClick = (tab: TabType) => {
    setCurrentTab(tab)
    onTabChange(tab)
  }

  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-8" aria-label="Profile tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-4 font-semibold transition-all duration-200 relative ${
              currentTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-current={currentTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
            {currentTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-slideUp" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
