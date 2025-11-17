// ABOUTME: Skeleton loading components for better UX
// ABOUTME: Provides shimmer effect placeholders while content loads

import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800',
        className
      )}
      {...props}
    />
  )
}

export function PostSkeleton() {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
      <div className="flex gap-3">
        {/* Avatar */}
        <Skeleton className="h-12 w-12 rounded-full" />

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>

          {/* Post content */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-48 w-full rounded-t-lg" />
        <div className="px-4 pb-4 bg-white dark:bg-gray-900 rounded-b-lg">
          <Skeleton className="h-24 w-24 rounded-full -mt-12 border-4 border-white dark:border-gray-900" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}
