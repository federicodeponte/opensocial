// ABOUTME: Stripe payment client configuration
// ABOUTME: Handle creator tips, donations, and optional cosmetic upgrades

import Stripe from 'stripe'

// Server-side Stripe client - only initialize if API key is provided
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
    })
  : null

export { stripe }

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null
}

/**
 * Stripe publishable key for client-side
 */
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

/**
 * Tip amounts (one-time payments)
 */
export const TIP_AMOUNTS = [
  { label: '$1', value: 100, emoji: '☕' }, // Coffee
  { label: '$3', value: 300, emoji: '🍕' }, // Pizza slice
  { label: '$5', value: 500, emoji: '🍔' }, // Burger
  { label: '$10', value: 1000, emoji: '🎁' }, // Gift
  { label: '$25', value: 2500, emoji: '💎' }, // Diamond
  { label: 'Custom', value: 0, emoji: '✨' }, // Custom amount
] as const

/**
 * Optional supporter tiers (cosmetic only, all features free)
 */
export const SUPPORTER_TIERS = [
  {
    id: 'supporter',
    name: 'Supporter',
    price: 300, // $3/month
    interval: 'month' as const,
    benefits: [
      'Supporter badge on profile',
      'Special profile border color',
      'Early access to new features',
      'Support platform development',
    ],
    emoji: '⭐',
    color: '#3B82F6', // Blue
  },
  {
    id: 'champion',
    name: 'Champion',
    price: 500, // $5/month
    interval: 'month' as const,
    benefits: [
      'Champion badge on profile',
      'Custom profile theme colors',
      'Priority support',
      'Exclusive supporter-only channel',
      'All Supporter benefits',
    ],
    emoji: '🏆',
    color: '#8B5CF6', // Purple
  },
  {
    id: 'patron',
    name: 'Patron',
    price: 1000, // $10/month
    interval: 'month' as const,
    benefits: [
      'Patron badge on profile',
      'Animated profile effects',
      'Custom badge upload',
      'Listed in supporters page',
      'All Champion benefits',
    ],
    emoji: '👑',
    color: '#F59E0B', // Gold
  },
] as const

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

/**
 * Format amount to currency
 */
export function formatCurrency(amountInCents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100)
}

/**
 * Calculate platform fee (5% to cover costs)
 */
export function calculatePlatformFee(amount: number): {
  creatorAmount: number
  platformFee: number
  stripeFee: number
  total: number
} {
  const stripeFee = Math.round(amount * 0.029 + 30) // Stripe: 2.9% + $0.30
  const platformFee = Math.round(amount * 0.05) // Platform: 5%
  const creatorAmount = amount - stripeFee - platformFee

  return {
    creatorAmount,
    platformFee,
    stripeFee,
    total: amount,
  }
}
