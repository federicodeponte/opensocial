// ABOUTME: Verified badge component for displaying verification status
// ABOUTME: Shows blue checkmark next to verified users' names

import { BadgeCheck } from 'lucide-react'

interface VerifiedBadgeProps {
  /**
   * Size variant of the badge
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Additional CSS classes
   */
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

/**
 * Verified badge component showing a blue checkmark
 * Used next to verified users' names on profiles and posts
 */
export function VerifiedBadge({ size = 'md', className = '' }: VerifiedBadgeProps) {
  return (
    <span title="Verified user">
      <BadgeCheck
        className={`${sizeClasses[size]} text-blue-500 fill-blue-100 inline-block ${className}`}
        aria-label="Verified user"
      />
    </span>
  )
}
