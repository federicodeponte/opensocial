// ABOUTME: Referral dashboard component
// ABOUTME: Show referral code, stats, and invite options

'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Share2, Users, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  getReferralStats,
  getUserReferrals,
  type ReferralStats,
  type Referral,
} from '@/lib/growth/referrals'
import { copyToClipboard } from '@/lib/growth/social-sharing'
import { toast } from 'sonner'

interface ReferralDashboardProps {
  userId: string
  referralCode: string
}

export function ReferralDashboard({
  userId,
  referralCode,
}: ReferralDashboardProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const referralUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/signup?ref=${referralCode}`
      : `https://opensocial.app/signup?ref=${referralCode}`

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, referralsData] = await Promise.all([
          getReferralStats(userId),
          getUserReferrals(userId),
        ])
        setStats(statsData)
        setReferrals(referralsData)
      } catch (error) {
        console.error('Failed to load referral data:', error)
        toast.error('Failed to load referral data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  const handleCopyCode = async () => {
    const success = await copyToClipboard(referralCode)
    if (success) {
      setCopied(true)
      toast.success('Referral code copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyLink = async () => {
    const success = await copyToClipboard(referralUrl)
    if (success) {
      toast.success('Referral link copied!')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading referral data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Gift className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Your Referral Code</h3>
            <div className="flex items-center justify-center gap-2">
              <code className="text-2xl font-bold bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                {referralCode}
              </code>
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="icon"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={handleCopyLink} variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Copy Invite Link
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Invite friends and earn rewards when they join!
          </p>
        </div>
      </Card>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Referrals</div>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedReferrals}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingReferrals}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Rewards</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalRewards} pts
            </div>
          </Card>
        </div>
      )}

      {/* Referral List */}
      {referrals.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Referrals
          </h3>

          <div className="space-y-3">
            {referrals.slice(0, 10).map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    User #{referral.referredUserId.slice(0, 8)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {referral.status === 'completed' && (
                    <span className="text-sm font-medium text-green-600">
                      +{referral.rewardAmount} pts
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      referral.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : referral.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {referral.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {referrals.length > 10 && (
            <div className="text-center mt-4">
              <Button variant="outline" size="sm">
                View All ({referrals.length})
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
