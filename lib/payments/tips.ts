// ABOUTME: Creator tipping functionality
// ABOUTME: One-time payments to support creators

import { stripe } from './stripe-client'

export interface TipPayment {
  id: string
  amount: number
  currency: string
  creatorId: string
  supporterId: string
  message?: string
  status: 'pending' | 'succeeded' | 'failed'
  createdAt: string
}

/**
 * Create a tip payment intent
 */
export async function createTipPaymentIntent(
  amount: number,
  creatorId: string,
  supporterId: string,
  message?: string
): Promise<{
  clientSecret: string
  paymentIntentId: string
}> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        type: 'tip',
        creatorId,
        supporterId,
        message: message || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Failed to create tip payment intent:', error)
    throw error
  }
}

/**
 * Record tip in database (after successful payment)
 */
export async function recordTip(
  paymentIntentId: string,
  amount: number,
  creatorId: string,
  supporterId: string,
  message?: string
) {
  // TODO: Save to database
  // await supabase.from('tips').insert({
  //   payment_intent_id: paymentIntentId,
  //   amount,
  //   creator_id: creatorId,
  //   supporter_id: supporterId,
  //   message,
  //   status: 'succeeded',
  //   created_at: new Date().toISOString(),
  // })

  return {
    id: paymentIntentId,
    amount,
    creatorId,
    supporterId,
    message,
    status: 'succeeded' as const,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Get creator's total tips received
 */
export async function getCreatorTips(creatorId: string): Promise<{
  totalAmount: number
  tipCount: number
  topSupporters: Array<{ userId: string; totalAmount: number }>
}> {
  // TODO: Query from database
  // const { data: tips } = await supabase
  //   .from('tips')
  //   .select('amount, supporter_id')
  //   .eq('creator_id', creatorId)
  //   .eq('status', 'succeeded')

  // Mock data for now
  return {
    totalAmount: 0,
    tipCount: 0,
    topSupporters: [],
  }
}

/**
 * Get recent tips for a creator
 */
export async function getRecentTips(
  creatorId: string,
  limit = 10
): Promise<TipPayment[]> {
  // TODO: Query from database
  // const { data: tips } = await supabase
  //   .from('tips')
  //   .select('*')
  //   .eq('creator_id', creatorId)
  //   .eq('status', 'succeeded')
  //   .order('created_at', { ascending: false })
  //   .limit(limit)

  return []
}
