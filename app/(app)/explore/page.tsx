// ABOUTME: Explore page showing trending content and discovery features
// ABOUTME: Displays trending posts, hashtags, and user recommendations in tabs

import { TrendingPosts } from '@/components/trending/TrendingPosts'
import { ExploreTabs } from './ExploreTabs'

export const metadata = {
  title: 'Explore - OpenSocial',
  description: 'Discover trending posts, hashtags, and people',
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Explore</h1>
        </div>
      </div>

      {/* Tabs */}
      <ExploreTabs />
    </div>
  )
}
