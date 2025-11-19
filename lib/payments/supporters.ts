// ABOUTME: Supporter subscription management
// ABOUTME: Optional monthly support tiers (cosmetic benefits only)

import { stripe, SUPPORTER_TIERS } from './stripe-client'

export interface SupporterSubscription {
  id: string
  userId: string
  tierId: string
  status: 'active' | 'canceled' | 'past_due'
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

/**
 * Create Stripe products and prices for supporter tiers (run once)
 */
export async function setupSupporterProducts() {
  const products = []

  for (const tier of SUPPORTER_TIERS) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: `${tier.emoji} ${tier.name} Supporter`,
        description: tier.benefits.join(' • '),
        metadata: {
          tierId: tier.id,
        },
      })

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.price,
        currency: 'usd',
        recurring: {
          interval: tier.interval,
        },
      })

      products.push({ product, price, tier })
    } catch (error) {
      console.error(`Failed to create product for ${tier.id}:`, error)
    }
  }

  return products
}

/**
 * Create checkout session for supporter subscription
 */
export async function createSupporterCheckout(
  userId: string,
  tierId: string,
  priceId: string
): Promise<{ sessionId: string; url: string }> {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/supporter?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/supporter?canceled=true`,
      metadata: {
        userId,
        tierId,
      },
    })

    return {
      sessionId: session.id,
      url: session.url!,
    }
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    throw error
  }
}

/**
 * Create customer portal session (manage subscription)
 */
export async function createPortalSession(
  customerId: string
): Promise<{ url: string }> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/supporter`,
    })

    return { url: session.url }
  } catch (error) {
    console.error('Failed to create portal session:', error)
    throw error
  }
}

/**
 * Cancel supporter subscription
 */
export async function cancelSupporterSubscription(
  subscriptionId: string,
  cancelImmediately = false
): Promise<void> {
  try {
    if (cancelImmediately) {
      await stripe.subscriptions.cancel(subscriptionId)
    } else {
      // Cancel at period end (keep benefits until then)
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
    }
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    throw error
  }
}

/**
 * Get user's active supporter tier
 */
export async function getUserSupporterTier(
  userId: string
): Promise<typeof SUPPORTER_TIERS[number] | null> {
  // TODO: Query from database
  // const { data: subscription } = await supabase
  //   .from('supporter_subscriptions')
  //   .select('tier_id')
  //   .eq('user_id', userId)
  //   .eq('status', 'active')
  //   .single()

  // if (!subscription) return null

  // return SUPPORTER_TIERS.find(t => t.id === subscription.tier_id) || null

  return null
}

/**
 * Check if user is a supporter
 */
export async function isUserSupporter(userId: string): Promise<boolean> {
  const tier = await getUserSupporterTier(userId)
  return tier !== null
}

/**
 * Get supporter badge for user
 */
export async function getSupporterBadge(
  userId: string
): Promise<{ emoji: string; name: string; color: string } | null> {
  const tier = await getUserSupporterTier(userId)

  if (!tier) return null

  return {
    emoji: tier.emoji,
    name: tier.name,
    color: tier.color,
  }
}
