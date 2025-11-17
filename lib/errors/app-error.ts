// ABOUTME: Custom error classes for type-safe error handling across the application
// ABOUTME: Provides structured errors with codes, messages, and optional metadata

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface ErrorMetadata {
  [key: string]: unknown
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly metadata?: ErrorMetadata

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    isOperational = true,
    metadata?: ErrorMetadata
  ) {
    super(message)

    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.metadata = metadata

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype)
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.metadata && { metadata: this.metadata }),
      },
    }
  }
}

// Specific error types for common scenarios

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', metadata?: ErrorMetadata) {
    super(message, ErrorCode.UNAUTHORIZED, 401, true, metadata)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, metadata)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, metadata?: ErrorMetadata) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404, true, metadata)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorCode.CONFLICT, 409, true, metadata)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorCode.DATABASE_ERROR, 500, true, metadata)
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', metadata?: ErrorMetadata) {
    super(message, ErrorCode.INTERNAL_ERROR, 500, false, metadata)
  }
}
