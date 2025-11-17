// ABOUTME: Structured logging utility for consistent logging across the application
// ABOUTME: Provides different log levels and structured context for better debugging
//
// NOTE: Currently wraps console.* with JSON formatting. In production, this should be
// extended to send logs to external services (Sentry, DataDog, LogRocket, etc.)

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface Logger {
  debug: (message: string, context?: LogContext) => void
  info: (message: string, context?: LogContext) => void
  warn: (message: string, context?: LogContext) => void
  error: (message: string, context?: LogContext) => void
}

/**
 * Structured logger that formats logs as JSON
 *
 * Benefits over console.log/error:
 * 1. Consistent format across entire application
 * 2. Structured context data (easier to parse/search)
 * 3. Log levels for filtering
 * 4. Timestamps on every log
 * 5. Single point to add external logging services
 *
 * Future improvements:
 * - Send to Sentry/DataDog in production
 * - Add request IDs for tracing
 * - Add user context when available
 * - Implement log sampling for high-volume scenarios
 */
class AppLogger implements Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
    }

    // Format as JSON for structured parsing
    // In development: pretty-print for readability
    // In production: single-line for log aggregation tools
    const formatted = this.isDevelopment
      ? JSON.stringify(logEntry, null, 2)
      : JSON.stringify(logEntry)

    // Console output (will be captured by log aggregators in production)
    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted)
        }
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }

    // TODO: Send to external logging service in production
    // Example integration:
    // if (!this.isDevelopment) {
    //   Sentry.captureMessage(message, { level, extra: context })
    //   // or DataDog: datadogLogs.logger.log(message, context, level)
    // }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context)
  }
}

// Export singleton instance
export const logger = new AppLogger()

// Export type for dependency injection
export type { Logger }
