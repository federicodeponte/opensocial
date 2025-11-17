// ABOUTME: Direct messages page
// ABOUTME: Lists conversations and shows chat interface

'use client'

import { useConversations } from '@/lib/hooks/useMessages'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function MessagesPage() {
  const { data: conversations, isLoading } = useConversations()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-8">
          <h2 className="text-2xl font-bold mb-6">Messages</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-300" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-300 rounded" />
                    <div className="h-4 w-48 bg-gray-300 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">Messages</h2>

        {!conversations || conversations.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 text-lg">No messages yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Start a conversation by visiting a profile and clicking Message
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className="block bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {conversation.other_user.avatar_url ? (
                    <img
                      src={conversation.other_user.avatar_url}
                      alt={conversation.other_user.display_name || conversation.other_user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {(conversation.other_user.display_name?.[0] || conversation.other_user.username[0]).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">
                        {conversation.other_user.display_name || conversation.other_user.username}
                      </h3>
                      {conversation.latest_message && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(conversation.latest_message.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      @{conversation.other_user.username}
                    </p>
                    {conversation.latest_message && (
                      <p className="text-sm text-gray-700 truncate mt-1">
                        {conversation.latest_message.content}
                      </p>
                    )}
                  </div>
                  {conversation.unread_count > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
