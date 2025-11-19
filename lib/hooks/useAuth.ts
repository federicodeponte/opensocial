// ABOUTME: Authentication hooks with Supabase Auth
// ABOUTME: Login, signup, logout, session management

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/auth/supabase-client'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      })
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      })
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signUp = async (email: string, password: string, metadata?: { display_name?: string; username?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) throw error

      if (data.user) {
        toast.success('Account created! Please check your email to verify.')
        return { user: data.user, error: null }
      }

      return { user: null, error: new Error('Failed to create account') }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up')
      return { user: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Welcome back!')
      router.push('/home')
      return { user: data.user, error: null }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
      return { user: null, error }
    }
  }

  const signInWithMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      toast.success('Check your email for the magic link!')
      return { error: null }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link')
      return { error }
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      return { error: null }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with OAuth')
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast.success('Signed out successfully')
      router.push('/')
      return { error: null }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      toast.success('Password reset email sent!')
      return { error: null }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
      return { error }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success('Password updated successfully')
      return { error: null }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
      return { error }
    }
  }

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    isAuthenticated: !!authState.user,
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
  }
}
