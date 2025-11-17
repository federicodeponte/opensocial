// ABOUTME: Error boundary component for graceful error handling
// ABOUTME: Catches React errors and displays fallback UI with retry option

'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We encountered an error while loading this content.
              </p>
              {this.state.error && (
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    Show error details
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-left overflow-x-auto text-xs">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>

            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.location.reload()
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Simple error fallback component
 */
export function ErrorFallback({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {message || 'Failed to load content'}
        </p>
      </div>
    </div>
  )
}

/**
 * Empty state component
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-8">
      <div className="text-center space-y-4 max-w-md">
        {icon && <div className="flex justify-center opacity-50">{icon}</div>}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  )
}
