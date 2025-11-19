// ABOUTME: Supporter badge display component
// ABOUTME: Shows supporter status on profiles and posts

'use client'

interface SupporterBadgeProps {
  emoji: string
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export function SupporterBadge({
  emoji,
  name,
  color,
  size = 'md',
  showName = false,
}: SupporterBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const emojiSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}40`,
      }}
      title={`${name} Supporter`}
    >
      <span className={emojiSizes[size]}>{emoji}</span>
      {showName && <span>{name}</span>}
    </span>
  )
}

/**
 * Supporter badge for profiles
 */
export function ProfileSupporterBadge({
  tier,
}: {
  tier: { emoji: string; name: string; color: string }
}) {
  return (
    <div
      className="absolute -top-1 -right-1 rounded-full p-1.5 shadow-lg"
      style={{
        backgroundColor: tier.color,
      }}
      title={`${tier.name} Supporter`}
    >
      <span className="text-white text-lg">{tier.emoji}</span>
    </div>
  )
}
