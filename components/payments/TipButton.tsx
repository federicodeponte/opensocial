// ABOUTME: Tip button component for creator support
// ABOUTME: One-time payments to support content creators

'use client'

import { useState } from 'react'
import { DollarSign, Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TIP_AMOUNTS, formatCurrency } from '@/lib/payments/stripe-client'

interface TipButtonProps {
  creatorId: string
  creatorName: string
  supporterId?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export function TipButton({
  creatorId,
  creatorName,
  supporterId,
  size = 'default',
  variant = 'outline',
}: TipButtonProps) {
  const [showTipModal, setShowTipModal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTip = async () => {
    if (!selectedAmount || !supporterId) return

    setLoading(true)

    try {
      // Create payment intent
      const response = await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedAmount,
          creatorId,
          supporterId,
          message,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      const { clientSecret } = await response.json()

      // Redirect to Stripe Checkout or use Stripe Elements
      // For now, just show success
      alert(`Tip of ${formatCurrency(selectedAmount)} sent to ${creatorName}!`)
      setShowTipModal(false)
      setSelectedAmount(null)
      setMessage('')
    } catch (error) {
      console.error('Tip error:', error)
      alert('Failed to process tip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!supporterId) {
    return null // Don't show tip button if not logged in
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowTipModal(true)}
        className="gap-2"
      >
        <Heart className="h-4 w-4" />
        Tip
      </Button>

      {showTipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Tip {creatorName}</h2>
              <button
                onClick={() => setShowTipModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Show your support with a one-time tip. 100% goes to the creator (minus payment processing fees).
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {TIP_AMOUNTS.filter((a) => a.value > 0).map((amount) => (
                <button
                  key={amount.value}
                  onClick={() => {
                    setSelectedAmount(amount.value)
                    setCustomAmount('')
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedAmount === amount.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{amount.emoji}</div>
                  <div className="text-sm font-medium">{amount.label}</div>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Custom Amount (min $1)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg">$</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    const amount = parseFloat(e.target.value) * 100
                    if (amount >= 100) {
                      setSelectedAmount(Math.round(amount))
                    }
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="10.00"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={280}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Say something nice..."
              />
              <p className="text-xs text-gray-500 mt-1">{message.length}/280</p>
            </div>

            <Button
              onClick={handleTip}
              disabled={!selectedAmount || loading}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  Send Tip {selectedAmount && `(${formatCurrency(selectedAmount)})`}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
