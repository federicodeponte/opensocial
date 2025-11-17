import { createClient } from '@/lib/auth/supabase-server'
import { redirect } from 'next/navigation'
import { PostComposer } from '@/components/posts/PostComposer'
import { PostFeed } from '@/components/posts/PostFeed'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">OpenSocial</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, @{user.user_metadata.username || 'user'}
          </p>
        </div>

        {/* Post composer */}
        <div className="mb-6">
          <PostComposer />
        </div>

        {/* Feed */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
          <PostFeed />
        </div>
      </div>
    </div>
  )
}
