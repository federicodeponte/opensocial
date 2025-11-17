// ABOUTME: React Query hooks for direct messages with Realtime
// ABOUTME: Fetch conversations, messages, and send messages with live updates

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/auth/supabase-client'

export interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface Conversation {
  id: string
  updated_at: string
  other_user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  latest_message: Message | null
  unread_count: number
}

/**
 * Hook to fetch user's conversations with Realtime updates
 */
export function useConversations() {
  const queryClient = useQueryClient()

  const query = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await fetch('/api/messages/conversations')
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      const { data } = await response.json()
      return data
    },
  })

  // Subscribe to real-time conversation updates
  useEffect(() => {
    const supabase = createClient()

    // Subscribe to new messages (updates conversations)
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Invalidate conversations when any new message arrives
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          // Invalidate when new conversation is created
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

/**
 * Hook to fetch messages in a conversation with Realtime updates
 */
export function useConversationMessages(conversationId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID required')

      const response = await fetch(`/api/messages/conversations/${conversationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const { data } = await response.json()
      return data
    },
    enabled: !!conversationId,
  })

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Invalidate query to refetch with new message
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, queryClient])

  return query
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      const { data } = await response.json()
      return data
    },
    onSuccess: (_, { conversationId }) => {
      // Invalidate messages and conversations
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook to create a conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId }),
      })
      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
