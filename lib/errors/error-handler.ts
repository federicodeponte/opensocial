// ABOUTME: Centralized error handling utilities for consistent error responses
// ABOUTME: Provides error logging and formatting for API routes

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError, ErrorCode, InternalError, ValidationError } from './app-error'
import { logger } from '../utils/logger'

export interface ErrorResponse {
  error: {
    code: string
    message: string
    metadata?: Record<string, unknown>
    validationErrors?: Array<{
      field: string
      message: string
    }>
  }
}

/**
 * Handles errors in API routes and returns appropriate NextResponse
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Handle our custom AppError
  if (error instanceof AppError) {
    logger.error('Application error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      metadata: error.metadata,
      stack: error.stack,
    })

    return NextResponse.json(error.toJSON(), { status: error.statusCode })
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))

    const validationError = new ValidationError('Validation failed', {
      validationErrors,
    })

    logger.error('Validation error', {
      errors: error.issues,
    })

    return NextResponse.json(
      {
        error: {
          code: validationError.code,
          message: validationError.message,
          validationErrors,
        },
      },
      { status: validationError.statusCode }
    )
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    logger.error('Unexpected error', {
      message: error.message,
      stack: error.stack,
    })

    const internalError = new InternalError(error.message)
    return NextResponse.json(internalError.toJSON(), { status: 500 })
  }

  // Handle unknown errors
  logger.error('Unknown error', { error })

  const unknownError = new InternalError('An unexpected error occurred')
  return NextResponse.json(unknownError.toJSON(), { status: 500 })
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred'
}

/**
 * Converts Supabase errors to AppError
 */
export function handleSupabaseError(error: unknown): never {
  const message = getErrorMessage(error)

  // Check for common Supabase error patterns
  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as { code?: string; message?: string; details?: string }

    // Authentication errors
    if (supabaseError.code === 'PGRST301' || message.includes('JWT')) {
      throw new AppError(
        'Authentication required',
        ErrorCode.UNAUTHORIZED,
        401,
        true,
        { originalError: supabaseError }
      )
    }

    // Unique constraint violations
    if (supabaseError.code === '23505' || message.includes('duplicate key')) {
      throw new AppError(
        'Resource already exists',
        ErrorCode.ALREADY_EXISTS,
        409,
        true,
        { originalError: supabaseError }
      )
    }

    // Foreign key violations
    if (supabaseError.code === '23503') {
      throw new AppError(
        'Referenced resource not found',
        ErrorCode.NOT_FOUND,
        404,
        true,
        { originalError: supabaseError }
      )
    }

    // Row level security violations
    if (message.includes('row-level security') || message.includes('policy')) {
      throw new AppError(
        'Insufficient permissions',
        ErrorCode.FORBIDDEN,
        403,
        true,
        { originalError: supabaseError }
      )
    }
  }

  // Generic database error
  throw new AppError(
    message,
    ErrorCode.DATABASE_ERROR,
    500,
    true,
    { originalError: error }
  )
}
