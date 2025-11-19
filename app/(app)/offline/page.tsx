// ABOUTME: Offline fallback page for PWA
// ABOUTME: Shows when app is offline and page not cached

'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            You're Offline
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isOnline
              ? "You're back online! Try refreshing the page."
              : "It looks like you've lost your internet connection. Don't worry, your posts are saved and will sync when you're back online."}
          </p>
        </div>

        <div className="space-y-4">
          {isOnline ? (
            <Button onClick={handleRefresh} className="w-full" size="lg">
              <RefreshCw className="mr-2 h-5 w-5" />
              Refresh Page
            </Button>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                While you're offline, you can:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
                <li>✓ View cached posts and profiles</li>
                <li>✓ Compose new posts (will sync later)</li>
                <li>✓ Like and retweet (will sync later)</li>
                <li>✓ Read notifications</li>
              </ul>
            </div>
          )}

          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Go Back
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Connection status:{' '}
            <span
              className={
                isOnline
                  ? 'text-green-600 dark:text-green-400 font-semibold'
                  : 'text-red-600 dark:text-red-400 font-semibold'
              }
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
