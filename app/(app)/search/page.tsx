// ABOUTME: Advanced search page with users, posts, and hashtags
// ABOUTME: Includes tabs, filters, and comprehensive search

import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import AdvancedSearchClient from './AdvancedSearchClient'

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  )
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Search</h1>
          {query && (
            <p className="text-gray-600 mt-1">
              Results for &quot;{query}&quot;
            </p>
          )}
        </div>

        <Suspense fallback={<SearchResultsSkeleton />}>
          <AdvancedSearchClient query={query} />
        </Suspense>
      </div>
    </div>
  )
}
