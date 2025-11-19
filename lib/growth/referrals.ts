// ABOUTME: Referral system with unique codes and rewards
// ABOUTME: Generate codes, track referrals, calculate rewards

// @ts-nocheck
import { createClient } from '@/lib/auth/supabase-client'

export interface Referral {
  id: string
  referrerId: string
  referredUserId: string
  referralCode: string
  status: 'pending' | 'completed' | 'rewarded'
  createdAt: string
  completedAt?: string
  rewardAmount?: number
}

export interface ReferralStats {
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
  totalRewards: number
  conversionRate: number
}

/**
 * Generate unique referral code for user
 */
export function generateReferralCode(username: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  const userPart = username.substring(0, 4).toUpperCase()
  return `${userPart}${randomPart}`
}

/**
 * Create referral entry
 */
export async function createReferral(
  referralCode: string,
  referredUserId: string
): Promise<Referral | null> {
  const supabase = createClient()

  // Find referrer by code
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', referralCode)
    .single()

  if (!referrer) {
    throw new Error('Invalid referral code')
  }

  // Don't allow self-referral
  if (referrer.id === referredUserId) {
    throw new Error('Cannot refer yourself')
  }

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_user_id: referredUserId,
      referral_code: referralCode,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    referrerId: data.referrer_id,
    referredUserId: data.referred_user_id,
    referralCode: data.referral_code,
    status: data.status,
    createdAt: data.created_at,
  }
}

/**
 * Mark referral as completed (when referred user takes action)
 */
export async function completeReferral(
  referralId: string,
  rewardAmount: number = 100
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('referrals')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      reward_amount: rewardAmount,
    })
    .eq('id', referralId)

  if (error) throw error
}

/**
 * Get user's referral statistics
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const supabase = createClient()

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)

  if (!referrals) {
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalRewards: 0,
      conversionRate: 0,
    }
  }

  const completedReferrals = referrals.filter((r: any) => r.status === 'completed')
  const totalRewards = completedReferrals.reduce(
    (sum: number, r: any) => sum + (r.reward_amount || 0),
    0
  )

  return {
    totalReferrals: referrals.length,
    completedReferrals: completedReferrals.length,
    pendingReferrals: referrals.filter((r) => r.status === 'pending').length,
    totalRewards,
    conversionRate:
      referrals.length > 0
        ? (completedReferrals.length / referrals.length) * 100
        : 0,
  }
}

/**
 * Get user's referral list
 */
export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      referred_profile:profiles!referrals_referred_user_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (
    data?.map((r: any) => ({
      id: r.id,
      referrerId: r.referrer_id,
      referredUserId: r.referred_user_id,
      referralCode: r.referral_code,
      status: r.status,
      createdAt: r.created_at,
      completedAt: r.completed_at,
      rewardAmount: r.reward_amount,
    })) || []
  )
}

/**
 * Check if user was referred
 */
export async function getUserReferralSource(
  userId: string
): Promise<Referral | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      referrer_profile:profiles!referrals_referrer_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('referred_user_id', userId)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    referrerId: data.referrer_id,
    referredUserId: data.referred_user_id,
    referralCode: data.referral_code,
    status: data.status,
    createdAt: data.created_at,
    completedAt: data.completed_at,
    rewardAmount: data.reward_amount,
  }
}

/**
 * Get top referrers leaderboard
 */
export async function getTopReferrers(limit: number = 10) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('referrals')
    .select(`
      referrer_id,
      referrer_profile:profiles!referrals_referrer_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('status', 'completed')

  if (error) throw error

  // Group by referrer and count
  const referrerCounts = new Map<string, { profile: any; count: number }>()

  data?.forEach((r: any) => {
    const referrerId = r.referrer_id
    if (referrerCounts.has(referrerId)) {
      referrerCounts.get(referrerId)!.count++
    } else {
      referrerCounts.set(referrerId, {
        profile: r.referrer_profile,
        count: 1,
      })
    }
  })

  // Convert to array and sort
  return Array.from(referrerCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item, index) => ({
      rank: index + 1,
      profile: item.profile,
      referrals: item.count,
    }))
}
