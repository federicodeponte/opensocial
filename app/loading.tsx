// ABOUTME: Global loading UI for Next.js app
// ABOUTME: Displays while pages are loading

import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}
