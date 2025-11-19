// ABOUTME: API endpoint for supporter subscriptions
// ABOUTME: Optional cosmetic upgrades (all features remain free)

import { NextRequest, NextResponse } from 'next/server'
import { createSupporterCheckout, createPortalSession } from '@/lib/payments/supporters'
import { isStripeConfigured } from '@/lib/payments/stripe-client'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { userId, tierId, priceId, action } = body

    // Create customer portal session
    if (action === 'portal') {
      const { customerId } = body
      if (!customerId) {
        return NextResponse.json(
          { error: 'customerId is required for portal' },
          { status: 400 }
        )
      }

      const { url } = await createPortalSession(customerId)
      return NextResponse.json({ url })
    }

    // Create checkout session
    if (!userId || !tierId || !priceId) {
      return NextResponse.json(
        { error: 'userId, tierId, and priceId are required' },
        { status: 400 }
      )
    }

    const { sessionId, url } = await createSupporterCheckout(userId, tierId, priceId)

    return NextResponse.json({ sessionId, url })
  } catch (error) {
    console.error('Supporter subscription API error:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}
