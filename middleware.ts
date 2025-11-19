// ABOUTME: Authentication middleware that protects routes and refreshes sessions
// ABOUTME: Includes rate limiting for API routes (FREE - no Redis needed)

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  apiRateLimiter,
  authRateLimiter,
  postRateLimiter,
  actionRateLimiter,
  getClientIp,
  getRateLimitHeaders,
} from '@/lib/utils/rate-limit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // =============================================
  // RATE LIMITING (applies to API routes only)
  // =============================================
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request)
    let rateLimitResult

    // Choose rate limiter based on endpoint
    if (pathname.startsWith('/api/auth/') || pathname.includes('/login') || pathname.includes('/signup')) {
      // Auth endpoints: 10 requests/min (prevent brute force)
      rateLimitResult = await authRateLimiter.check(ip)
    } else if (pathname.startsWith('/api/posts') && request.method === 'POST') {
      // Post creation: 20 posts/min
      rateLimitResult = await postRateLimiter.check(ip)
    } else if (
      pathname.includes('/like') ||
      pathname.includes('/follow') ||
      pathname.includes('/retweet')
    ) {
      // Actions: 60 actions/min
      rateLimitResult = await actionRateLimiter.check(ip)
    } else {
      // General API: 100 requests/min
      rateLimitResult = await apiRateLimiter.check(ip)
    }

    // Rate limit exceeded
    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(
              request.method === 'POST' ? 20 : 100,
              rateLimitResult.remaining,
              rateLimitResult.reset
            ),
            'Retry-After': Math.ceil(
              (rateLimitResult.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next()
    const headers = getRateLimitHeaders(
      request.method === 'POST' ? 20 : 100,
      rateLimitResult.remaining,
      rateLimitResult.reset
    )
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  // =============================================
  // AUTHENTICATION (applies to page routes)
  // =============================================

  // Get environment variables with validation
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware')
    return NextResponse.redirect(new URL('/error', request.url))
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect to home if already authenticated and trying to access auth pages
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}
