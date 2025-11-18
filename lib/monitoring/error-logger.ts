// ABOUTME: Error logging and monitoring utilities
// ABOUTME: Centralized error tracking for production monitoring

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorLog {
  message: string
  stack?: string
  severity: ErrorSeverity
  context?: Record<string, any>
  timestamp: string
  userId?: string
  url?: string
  userAgent?: string
}

/**
 * Error logger class for centralized error tracking
 */
class ErrorLogger {
  private logs: ErrorLog[] = []
  private maxLogs = 100

  /**
   * Log an error with context
   */
  log(
    error: Error | string,
    severity: ErrorSeverity = 'medium',
    context?: Record<string, any>
  ) {
    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      severity,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    }

    // Add to logs
    this.logs.push(errorLog)

    // Maintain max logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}]`, errorLog.message, context)
      if (errorLog.stack) {
        console.error(errorLog.stack)
      }
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorLog)
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO]`, message, context)
    }
  }

  /**
   * Log warning
   */
  warn(message: string, context?: Record<string, any>) {
    this.log(message, 'low', context)
  }

  /**
   * Log critical error
   */
  critical(error: Error | string, context?: Record<string, any>) {
    this.log(error, 'critical', context)
  }

  /**
   * Get recent logs
   */
  getLogs(count = 10): ErrorLog[] {
    return this.logs.slice(-count)
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * Send error to monitoring service
   * Integrate with Sentry, LogRocket, etc.
   */
  private async sendToMonitoring(errorLog: ErrorLog) {
    try {
      // Send to your monitoring service
      // Example: Sentry, LogRocket, custom endpoint
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog),
      })
    } catch (error) {
      // Silently fail - don't want monitoring to break the app
      console.error('Failed to send error to monitoring:', error)
    }
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = new ErrorLogger()

/**
 * Set user context for error logging
 */
export function setUserContext(userId: string, userInfo?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    ;(window as any).__ERROR_LOGGER_USER = { userId, ...userInfo }
  }
}

/**
 * Clear user context
 */
export function clearUserContext() {
  if (typeof window !== 'undefined') {
    ;(window as any).__ERROR_LOGGER_USER = undefined
  }
}

/**
 * Get user context
 */
export function getUserContext() {
  if (typeof window !== 'undefined') {
    return (window as any).__ERROR_LOGGER_USER
  }
  return undefined
}

/**
 * Track API errors
 */
export function trackApiError(
  endpoint: string,
  status: number,
  error: Error | string,
  context?: Record<string, any>
) {
  errorLogger.log(error, status >= 500 ? 'high' : 'medium', {
    type: 'api_error',
    endpoint,
    status,
    ...context,
  })
}

/**
 * Track user action errors
 */
export function trackUserActionError(
  action: string,
  error: Error | string,
  context?: Record<string, any>
) {
  errorLogger.log(error, 'medium', {
    type: 'user_action_error',
    action,
    ...context,
  })
}

/**
 * Track performance issues
 */
export function trackPerformanceIssue(
  metric: string,
  value: number,
  threshold: number,
  context?: Record<string, any>
) {
  if (value > threshold) {
    errorLogger.warn(`Performance issue: ${metric} (${value}ms > ${threshold}ms)`, {
      type: 'performance',
      metric,
      value,
      threshold,
      ...context,
    })
  }
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.critical(event.reason, {
      type: 'unhandled_promise_rejection',
      promise: event.promise,
    })
  })

  // Handle global errors
  window.addEventListener('error', (event) => {
    errorLogger.critical(event.error || event.message, {
      type: 'global_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })
}
