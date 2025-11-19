// ABOUTME: Supporter tiers selection component
// ABOUTME: Optional cosmetic upgrades (all features always free)

'use client'

import { useState } from 'react'
import { Check, Heart, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUPPORTER_TIERS, formatCurrency } from '@/lib/payments/stripe-client'

interface SupporterTiersCardProps {
  userId?: string
  currentTierId?: string | null
}

export function SupporterTiersCard({ userId, currentTierId }: SupporterTiersCardProps) {
  const [loading, setLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  const handleSubscribe = async (tierId: string, priceId: string) => {
    if (!userId) {
      alert('Please log in to become a supporter')
      return
    }

    setLoading(true)
    setSelectedTier(tierId)

    try {
      const response = await fetch('/api/payments/supporter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tierId,
          priceId, // TODO: Get actual price ID from Stripe
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setLoading(false)
      setSelectedTier(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Become a Supporter</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Support OpenSocial development & get cosmetic perks
        </p>
        <p className="text-sm text-gray-500 mt-2">
          <strong>All features are 100% free forever.</strong> Supporter tiers are optional cosmetic upgrades only.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {SUPPORTER_TIERS.map((tier) => {
          const isCurrentTier = currentTierId === tier.id

          return (
            <div
              key={tier.id}
              className={`relative rounded-xl border-2 p-6 transition-all ${
                isCurrentTier
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
              style={
                !isCurrentTier
                  ? {
                      borderColor: `${tier.color}40`,
                    }
                  : undefined
              }
            >
              {isCurrentTier && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Current Plan
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-5xl mb-2">{tier.emoji}</div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: tier.color }}
                >
                  {tier.name}
                </h3>
                <div className="text-3xl font-bold mb-1">
                  {formatCurrency(tier.price)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  per {tier.interval}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(tier.id, 'price_test_123')}
                disabled={loading || isCurrentTier}
                className="w-full gap-2"
                style={
                  !isCurrentTier
                    ? {
                        backgroundColor: tier.color,
                      }
                    : undefined
                }
              >
                {isCurrentTier ? (
                  <>
                    <Check className="h-4 w-4" />
                    Active
                  </>
                ) : loading && selectedTier === tier.id ? (
                  'Processing...'
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold mb-2">💙 Why Support?</h4>
        <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <li>• Help keep OpenSocial free for everyone</li>
          <li>• Support ongoing development & new features</li>
          <li>• Get exclusive cosmetic perks & recognition</li>
          <li>• Cancel anytime, no questions asked</li>
        </ul>
      </div>
    </div>
  )
}
