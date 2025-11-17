// ABOUTME: Notifications list component with mark all as read
// ABOUTME: Displays all notifications with loading and empty states

'use client'

import { useNotifications, useMarkAllAsRead } from '@/lib/hooks/useNotifications'
import { NotificationItem } from './NotificationItem'
import { Button } from '@/components/ui/button'

export function NotificationsList() {
  const { data: notifications, isLoading, error } = useNotifications({ limit: 50 })
  const markAllAsRead = useMarkAllAsRead()

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold">Notifications</h2>
        </div>
        <div className="space-y-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-300 rounded" />
                  <div className="h-3 w-1/4 bg-gray-300 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="text-center text-red-600">
          Failed to load notifications
        </div>
      </div>
    )
  }

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? 'Marking...' : 'Mark all as read'}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {!notifications || notifications.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-gray-500 text-lg">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-2">
            When someone likes, retweets, or replies to your posts, you&apos;ll see it here
          </p>
        </div>
      ) : (
        <div>
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  )
}
