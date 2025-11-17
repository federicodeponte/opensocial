import { createClient } from '@/lib/auth/supabase-server'
import { redirect } from 'next/navigation'
import { PostComposer } from '@/components/posts/PostComposer'
import { InfiniteFeed } from '@/components/posts/InfiniteFeed'
import { SearchBar } from '@/components/search/SearchBar'
import { TrendingHashtagsWidget } from '@/components/trending/TrendingHashtagsWidget'
import { TrendingPostsWidget } from '@/components/trending/TrendingPosts'
import { WhoToFollowWidget } from '@/components/recommendations/WhoToFollowWidget'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold dark:text-white">OpenSocial</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Welcome back, @{user.user_metadata.username || 'user'}
                </p>
              </div>
              <ThemeToggle />
            </div>

            {/* Post composer */}
            <div className="mb-6">
              <PostComposer />
            </div>

            {/* Feed */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
              <InfiniteFeed />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Bar */}
            <div>
              <SearchBar />
            </div>

            {/* Trending Posts */}
            <TrendingPostsWidget limit={5} />

            {/* Trending Hashtags */}
            <TrendingHashtagsWidget limit={5} />

            {/* Who to Follow */}
            <WhoToFollowWidget limit={3} />
          </div>
        </div>
      </div>
    </div>
  )
}
