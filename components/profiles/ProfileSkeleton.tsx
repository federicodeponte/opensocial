// ABOUTME: Loading skeleton for profile page
// ABOUTME: Displays placeholder UI while profile data is loading

'use client'

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-2xl mx-auto">
        {/* Header Skeleton */}
        <div className="h-48 bg-gray-300" />

        <div className="px-4">
          {/* Profile Info Section */}
          <div className="relative">
            {/* Avatar Skeleton */}
            <div className="absolute -top-16 left-0">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300" />
            </div>

            {/* Edit Button Skeleton */}
            <div className="pt-4 flex justify-end">
              <div className="w-32 h-10 bg-gray-300 rounded-lg" />
            </div>
          </div>

          {/* Profile Details Skeleton */}
          <div className="mt-20 mb-6 space-y-3">
            {/* Display Name */}
            <div className="h-8 w-48 bg-gray-300 rounded" />
            {/* Username */}
            <div className="h-5 w-32 bg-gray-300 rounded" />
            {/* Bio */}
            <div className="space-y-2 mt-3">
              <div className="h-4 w-full bg-gray-300 rounded" />
              <div className="h-4 w-3/4 bg-gray-300 rounded" />
            </div>
            {/* Location/Website */}
            <div className="flex gap-4 mt-3">
              <div className="h-4 w-24 bg-gray-300 rounded" />
              <div className="h-4 w-32 bg-gray-300 rounded" />
            </div>
            {/* Following/Followers */}
            <div className="flex gap-4 mt-3">
              <div className="h-5 w-28 bg-gray-300 rounded" />
              <div className="h-5 w-28 bg-gray-300 rounded" />
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 w-20 bg-gray-300 rounded-t" />
              ))}
            </div>
          </div>

          {/* Posts Skeleton */}
          <div className="mt-6 mb-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 space-y-3">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-300" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-300 rounded" />
                    <div className="h-4 w-full bg-gray-300 rounded" />
                    <div className="h-4 w-5/6 bg-gray-300 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
