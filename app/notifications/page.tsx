// ABOUTME: Notifications page
// ABOUTME: Displays list of user notifications

import { NotificationsList } from '@/components/notifications/NotificationsList'

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationsList />
    </div>
  )
}
