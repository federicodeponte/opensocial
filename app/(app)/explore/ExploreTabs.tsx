// ABOUTME: Tabbed interface for explore page
// ABOUTME: Switches between For You, Trending, People, and Hashtags views

'use client'

import { useState } from 'react'
import { TrendingPosts } from '@/components/trending/TrendingPosts'
import { TrendingHashtagsWidget } from '@/components/trending/TrendingHashtagsWidget'
import { WhoToFollowWidget } from '@/components/recommendations/WhoToFollowWidget'
import { Flame, TrendingUp, Users, Hash } from 'lucide-react'

type Tab = 'for-you' | 'trending' | 'people' | 'hashtags'

export function ExploreTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('for-you')

  const tabs = [
    { id: 'for-you' as Tab, label: 'For you', icon: Flame },
    { id: 'trending' as Tab, label: 'Trending', icon: TrendingUp },
    { id: 'people' as Tab, label: 'People', icon: Users },
    { id: 'hashtags' as Tab, label: 'Hashtags', icon: Hash },
  ]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 font-medium text-sm
                  transition-colors relative
                  ${
                    isActive
                      ? 'text-blue-500'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'for-you' && <ForYouTab />}
        {activeTab === 'trending' && <TrendingTab />}
        {activeTab === 'people' && <PeopleTab />}
        {activeTab === 'hashtags' && <HashtagsTab />}
      </div>
    </div>
  )
}

function ForYouTab() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-3">Trending for you</h2>
        <TrendingPosts window="TODAY" limit={10} />
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Who to follow</h2>
        <WhoToFollowWidget limit={5} />
      </div>
    </div>
  )
}

function TrendingTab() {
  const [timeWindow, setTimeWindow] = useState<'NOW' | 'TODAY' | 'WEEK'>('TODAY')

  return (
    <div className="max-w-2xl mx-auto">
      {/* Time window selector */}
      <div className="flex gap-2 mb-4">
        {(['NOW', 'TODAY', 'WEEK'] as const).map((window) => (
          <button
            key={window}
            onClick={() => setTimeWindow(window)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${
                timeWindow === window
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {window === 'NOW' ? 'Right now' : window === 'TODAY' ? 'Today' : 'This week'}
          </button>
        ))}
      </div>

      <TrendingPosts window={timeWindow} limit={20} />
    </div>
  )
}

function PeopleTab() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-3">Suggested for you</h2>
      <WhoToFollowWidget limit={10} />
    </div>
  )
}

function HashtagsTab() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-3">Trending hashtags</h2>
      <TrendingHashtagsWidget limit={20} />
    </div>
  )
}
