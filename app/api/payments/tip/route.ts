// ABOUTME: API endpoint for creator tips
// ABOUTME: Create payment intent for one-time tips

import { NextRequest, NextResponse } from 'next/server'
import { createTipPaymentIntent, recordTip } from '@/lib/payments/tips'
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
    const { amount, creatorId, supporterId, message } = body

    // Validation
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least $1.00 (100 cents)' },
        { status: 400 }
      )
    }

    if (amount > 100000) {
      return NextResponse.json(
        { error: 'Amount cannot exceed $1,000' },
        { status: 400 }
      )
    }

    if (!creatorId || !supporterId) {
      return NextResponse.json(
        { error: 'creatorId and supporterId are required' },
        { status: 400 }
      )
    }

    // Create payment intent
    const { clientSecret, paymentIntentId } = await createTipPaymentIntent(
      amount,
      creatorId,
      supporterId,
      message
    )

    return NextResponse.json({
      clientSecret,
      paymentIntentId,
    })
  } catch (error) {
    console.error('Tip payment API error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

// Webhook to record successful tip
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, amount, creatorId, supporterId, message } = body

    // Record tip in database
    const tip = await recordTip(paymentIntentId, amount, creatorId, supporterId, message)

    return NextResponse.json({ success: true, tip })
  } catch (error) {
    console.error('Tip recording error:', error)
    return NextResponse.json(
      { error: 'Failed to record tip' },
      { status: 500 }
    )
  }
}
