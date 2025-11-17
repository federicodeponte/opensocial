// ABOUTME: Global error handler for Next.js app
// ABOUTME: Catches and displays errors at the app level

'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service (e.g., Sentry)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We're sorry for the inconvenience. The error has been logged and we'll look into it.
          </p>
        </div>

        {error.message && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Error details
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
              {error.message}
              {error.digest && `\n\nError ID: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')} className="gap-2">
            <Home className="h-4 w-4" />
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}
