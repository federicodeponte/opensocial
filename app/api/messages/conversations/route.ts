// ABOUTME: API endpoints for managing conversations
// ABOUTME: GET to list conversations, POST to create new conversation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { handleApiError } from '@/lib/errors/error-handler'

/**
 * GET /api/messages/conversations
 * List all conversations for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get conversations where user is a participant
    const { data: participantRecords, error: participantError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        last_read_at,
        conversations!inner (
          id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .order('conversations(updated_at)', { ascending: false })

    if (participantError) {
      throw participantError
    }

    // For each conversation, get the other participant and latest message
    const conversationsData = await Promise.all(
      participantRecords.map(async (record) => {
        const conversationId = record.conversation_id

        // Get other participant
        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            profiles!inner (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('conversation_id', conversationId)
          .neq('user_id', user.id)
          .limit(1)
          .single()

        // Get latest message
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .gt('created_at', record.last_read_at || '1970-01-01')

        return {
          id: conversationId,
          // @ts-ignore
          updated_at: record.conversations.updated_at,
          other_user: otherParticipants?.profiles,
          latest_message: latestMessage,
          unread_count: unreadCount || 0,
        }
      })
    )

    return NextResponse.json({ data: conversationsData })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/messages/conversations
 * Create a new conversation with a user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { otherUserId } = await request.json()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!otherUserId) {
      return NextResponse.json({ error: 'Other user ID required' }, { status: 400 })
    }

    if (otherUserId === user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
    }

    // Check if conversation already exists
    const { data: existingConversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (existingConversations) {
      for (const record of existingConversations) {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', record.conversation_id)
          .eq('user_id', otherUserId)
          .maybeSingle()

        if (otherParticipant) {
          // Conversation already exists
          return NextResponse.json({ data: { id: record.conversation_id } })
        }
      }
    }

    // Create new conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single()

    if (conversationError) {
      throw conversationError
    }

    // Add both participants
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: user.id },
        { conversation_id: conversation.id, user_id: otherUserId },
      ])

    if (participantError) {
      throw participantError
    }

    return NextResponse.json({ data: conversation })
  } catch (error) {
    return handleApiError(error)
  }
}
