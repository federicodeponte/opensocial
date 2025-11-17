import { createClient } from '@/lib/auth/supabase-server'
import { redirect } from 'next/navigation'
import { PostPage } from '@/components/posts/PostPage'

interface PostDetailPageProps {
  params: Promise<{
    postId: string
  }>
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <PostPage postId={postId} />
}
