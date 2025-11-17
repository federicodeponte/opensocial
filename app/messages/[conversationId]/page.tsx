// ABOUTME: Individual conversation chat interface
// ABOUTME: Shows message thread and composer for sending messages

'use client'

import { useConversationMessages, useSendMessage } from '@/lib/hooks/useMessages'
import { formatDistanceToNow } from 'date-fns'
import { useState, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/auth/supabase-client'

interface PageProps {
  params: Promise<{ conversationId: string }>
}

export default function ConversationPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const { conversationId } = resolvedParams
  const { data: messages, isLoading } = useConversationMessages(conversationId)
  const sendMessage = useSendMessage()
  const [content, setContent] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get current user from Supabase
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null)
    })
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: content.trim(),
      })
      setContent('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Link href="/messages" className="text-blue-600 hover:text-blue-700">
                ← Back
              </Link>
              <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse" />
              <div className="h-5 w-32 bg-gray-300 rounded animate-pulse" />
            </div>
          </div>
          {/* Messages Skeleton */}
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-xs">
                  <div className="h-16 w-48 bg-gray-300 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Link href="/messages" className="text-blue-600 hover:text-blue-700">
                ← Back
              </Link>
              <h2 className="text-xl font-bold">Messages</h2>
            </div>
          </div>
          {/* Empty State */}
          <div className="flex flex-col items-center justify-center h-96">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 text-lg">No messages yet</p>
            <p className="text-gray-400 text-sm mt-2">Send a message to start the conversation</p>
          </div>
          {/* Composer */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!content.trim() || sendMessage.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendMessage.isPending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get other user from first message
  const otherUser = messages[0].sender.id === currentUserId
    ? messages.find(m => m.sender.id !== currentUserId)?.sender
    : messages[0].sender

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/messages" className="text-blue-600 hover:text-blue-700">
              ← Back
            </Link>
            {otherUser && (
              <>
                {otherUser.avatar_url ? (
                  <img
                    src={otherUser.avatar_url}
                    alt={otherUser.display_name || otherUser.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {(otherUser.display_name?.[0] || otherUser.username[0]).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-bold">{otherUser.display_name || otherUser.username}</h2>
                  <p className="text-sm text-gray-500">@{otherUser.username}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId
            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-lg px-4 py-2 ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={!content.trim() || sendMessage.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendMessage.isPending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
