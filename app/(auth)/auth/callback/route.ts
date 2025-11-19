// ABOUTME: Auth callback handler for OAuth and magic link flows
// ABOUTME: Exchanges code for session and redirects to home

import { createClient } from '@/lib/auth/supabase-server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }

  // Redirect to home after successful authentication
  return NextResponse.redirect(`${origin}/home`)
}
