// ABOUTME: Simple in-memory rate limiter (FREE - no Redis needed)
// ABOUTME: Tracks requests by IP address with configurable limits

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

interface RateLimitData {
  count: number
  resetTime: number
}

// In-memory store for rate limit data
// Note: This resets on server restart, but that's fine for MVP
const rateLimitStore = new Map<string, RateLimitData>()

/**
 * Simple rate limiter using in-memory storage
 * FREE alternative to Redis-based rate limiting
 */
export class RateLimiter {
  private interval: number
  private uniqueTokenPerInterval: number

  constructor(config: RateLimitConfig) {
    this.interval = config.interval
    this.uniqueTokenPerInterval = config.uniqueTokenPerInterval

    // Cleanup old entries every minute to prevent memory leaks
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if request is rate limited
   * Returns { success: false, remaining: 0 } if rate limited
   * Returns { success: true, remaining: number } if allowed
   */
  async check(identifier: string): Promise<{
    success: boolean
    remaining: number
    reset: number
  }> {
    const now = Date.now()
    const data = rateLimitStore.get(identifier)

    // No previous requests or window expired
    if (!data || now > data.resetTime) {
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.interval,
      })

      return {
        success: true,
        remaining: this.uniqueTokenPerInterval - 1,
        reset: now + this.interval,
      }
    }

    // Within rate limit window
    if (data.count < this.uniqueTokenPerInterval) {
      data.count++
      rateLimitStore.set(identifier, data)

      return {
        success: true,
        remaining: this.uniqueTokenPerInterval - data.count,
        reset: data.resetTime,
      }
    }

    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      reset: data.resetTime,
    }
  }

  /**
   * Cleanup expired entries to prevent memory leaks
   */
  private cleanup() {
    const now = Date.now()
    for (const [identifier, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(identifier)
      }
    }
  }

  /**
   * Reset rate limit for a specific identifier
   * Useful for testing or manual overrides
   */
  reset(identifier: string) {
    rateLimitStore.delete(identifier)
  }

  /**
   * Get current stats for an identifier
   */
  getStats(identifier: string): RateLimitData | null {
    return rateLimitStore.get(identifier) || null
  }
}

/**
 * Predefined rate limiters for different endpoints
 */

// General API rate limit: 100 requests per minute
export const apiRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
})

// Auth rate limit: 10 requests per minute (prevent brute force)
export const authRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10,
})

// Post creation rate limit: 20 posts per minute
export const postRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 20,
})

// Like/follow rate limit: 60 actions per minute
export const actionRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 60,
})

/**
 * Helper to get IP address from request
 */
export function getClientIp(request: Request): string {
  // Try various headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (realIp) {
    return realIp.trim()
  }

  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  return 'unknown'
}

/**
 * Helper to create rate limit headers
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): HeadersInit {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(reset / 1000).toString(),
  }
}
