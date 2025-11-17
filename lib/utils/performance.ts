// ABOUTME: Performance monitoring and measurement utilities
// ABOUTME: Tracks query times, API response times, and provides performance metrics

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start

  if (process.env.NODE_ENV === 'development') {
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
  }

  return { result, duration }
}

/**
 * Performance mark for tracking specific operations
 */
export class PerformanceTracker {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number[]> = new Map()

  mark(name: string) {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark)
    if (!start) {
      console.warn(`No mark found for ${startMark}`)
      return 0
    }

    const duration = performance.now() - start

    // Store measure
    const existing = this.measures.get(name) || []
    existing.push(duration)
    this.measures.set(name, existing)

    // Clean up mark
    this.marks.delete(startMark)

    return duration
  }

  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const measures = this.measures.get(name)
    if (!measures || measures.length === 0) return null

    return {
      avg: measures.reduce((a, b) => a + b, 0) / measures.length,
      min: Math.min(...measures),
      max: Math.max(...measures),
      count: measures.length,
    }
  }

  clear() {
    this.marks.clear()
    this.measures.clear()
  }
}

/**
 * Global performance tracker
 */
export const perfTracker = new PerformanceTracker()

/**
 * Debounce function to limit execution rate
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Lazy load function - only execute once
 */
export function lazy<T>(fn: () => T): () => T {
  let result: T | undefined
  let executed = false

  return () => {
    if (!executed) {
      result = fn()
      executed = true
    }
    return result!
  }
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Log slow queries in development
 */
export function logSlowQuery(label: string, duration: number, threshold = 100) {
  if (duration > threshold) {
    console.warn(`⚠️ Slow query: ${label} took ${duration.toFixed(2)}ms`)
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
