// ABOUTME: Query optimization utilities for reducing N+1 problems
// ABOUTME: Provides batching and caching utilities for database queries

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Batch loader for reducing N+1 queries
 * Groups multiple single-record requests into one query
 */
export class DataLoader<T> {
  private cache = new Map<string, T>()
  private queue: string[] = []
  private batchTimeout: NodeJS.Timeout | null = null

  constructor(
    private fetchBatch: (ids: string[]) => Promise<T[]>,
    private getKey: (item: T) => string,
    private maxBatchSize = 100,
    private batchInterval = 10 // ms
  ) {}

  /**
   * Load a single item by ID
   * Automatically batches requests within the batch interval
   */
  async load(id: string): Promise<T | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!
    }

    // Add to queue
    this.queue.push(id)

    // Schedule batch if not already scheduled
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.executeBatch(), this.batchInterval)
    }

    // Wait for batch to complete
    return new Promise<T | null>((resolve) => {
      const checkCache = () => {
        if (this.cache.has(id)) {
          resolve(this.cache.get(id)!)
        } else {
          setTimeout(checkCache, 1)
        }
      }
      checkCache()
    })
  }

  /**
   * Execute batched query
   */
  private async executeBatch() {
    const ids = [...new Set(this.queue.splice(0, this.maxBatchSize))]
    this.batchTimeout = null

    if (ids.length === 0) return

    try {
      const items = await this.fetchBatch(ids)
      items.forEach((item) => {
        this.cache.set(this.getKey(item), item)
      })
    } catch (error) {
      console.error('Batch load error:', error)
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }
}

/**
 * Create a profile data loader
 */
export function createProfileLoader(supabase: SupabaseClient) {
  return new DataLoader<any>(
    async (userIds: string[]) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      return data || []
    },
    (profile) => profile.id
  )
}

/**
 * Create a post data loader
 */
export function createPostLoader(supabase: SupabaseClient) {
  return new DataLoader<any>(
    async (postIds: string[]) => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)

      return data || []
    },
    (post) => post.id
  )
}

/**
 * In-memory cache with TTL
 */
export class TTLCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>()

  constructor(private defaultTTL = 60000) {} // 1 minute default

  set(key: string, value: T, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }
}

/**
 * Query result cache for expensive queries
 */
export const queryCache = new TTLCache<any>(5 * 60 * 1000) // 5 minutes

/**
 * Cache a query result
 */
export async function cacheQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = queryCache.get(key)
  if (cached !== null) {
    return cached as T
  }

  const result = await fetcher()
  queryCache.set(key, result, ttl)
  return result
}
