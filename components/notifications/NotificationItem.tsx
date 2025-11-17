// ABOUTME: Individual notification item component
// ABOUTME: Displays notification with appropriate icon and message

'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { Notification } from '@/lib/hooks/useNotifications'
import { useMarkAsRead } from '@/lib/hooks/useNotifications'

interface NotificationItemProps {
  notification: Notification
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const markAsRead = useMarkAsRead()

  const handleClick = () => {
    if (!notification.read) {
      markAsRead.mutate(notification.id)
    }
  }

  const getNotificationMessage = () => {
    const displayName = notification.sender.display_name || notification.sender.username

    switch (notification.type) {
      case 'like':
        return `${displayName} liked your post`
      case 'retweet':
        return `${displayName} retweeted your post`
      case 'follow':
        return `${displayName} followed you`
      case 'reply':
        return `${displayName} replied to your post`
      case 'mention':
        return `${displayName} mentioned you`
      case 'quote':
        return `${displayName} quote-tweeted your post`
      default:
        return 'New notification'
    }
  }

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        )
      case 'retweet':
        return (
          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.413V13H5.5z" />
          </svg>
        )
      case 'follow':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        )
      case 'reply':
      case 'mention':
        return (
          <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        )
      case 'quote':
        return (
          <svg className="w-8 h-8 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  const linkHref = notification.type === 'follow'
    ? `/${notification.sender.username}`
    : notification.post_id
    ? `/posts/${notification.post_id}`
    : '#'

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  return (
    <Link
      href={linkHref}
      onClick={handleClick}
      className={`block p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Notification Icon */}
        <div className="flex-shrink-0">{getNotificationIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {/* Avatar */}
            {notification.sender.avatar_url ? (
              <img
                src={notification.sender.avatar_url}
                alt={notification.sender.display_name || notification.sender.username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {(notification.sender.display_name?.[0] || notification.sender.username[0]).toUpperCase()}
              </div>
            )}

            {/* Message and Time */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                {getNotificationMessage()}
              </p>
              <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
            </div>

            {/* Unread Indicator */}
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
