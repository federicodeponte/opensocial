// ABOUTME: Structured logging utility for consistent logging across the application
// ABOUTME: Provides different log levels and structured context for better debugging

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

    // In production, we'd send this to a logging service (e.g., Sentry, LogRocket)
    // For now, we'll use structured console logs
    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(JSON.stringify(logEntry, null, 2))
        }
        break
      case 'info':
        console.info(JSON.stringify(logEntry, null, 2))
        break
      case 'warn':
        console.warn(JSON.stringify(logEntry, null, 2))
        break
      case 'error':
        console.error(JSON.stringify(logEntry, null, 2))
        break
    }

    // TODO: In production, send to external logging service
    // if (!this.isDevelopment) {
    //   sendToExternalLogger(logEntry)
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
