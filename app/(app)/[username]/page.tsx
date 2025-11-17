import { createClient } from '@/lib/auth/supabase-server'
import { redirect } from 'next/navigation'
import { ProfilePage } from '@/components/profiles/ProfilePage'

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <ProfilePage username={username} />
}
