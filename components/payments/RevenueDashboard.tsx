// ABOUTME: Creator revenue dashboard
// ABOUTME: Track tips, supporters, and earnings

'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Users, Heart } from 'lucide-react'
import { formatCurrency } from '@/lib/payments/stripe-client'

interface RevenueStats {
  totalEarnings: number
  monthlyEarnings: number
  tipCount: number
  supporterCount: number
  topSupporters: Array<{ username: string; amount: number }>
  recentTips: Array<{
    id: string
    amount: number
    supporter: string
    message?: string
    date: string
  }>
}

interface RevenueDashboardProps {
  creatorId: string
}

export function RevenueDashboard({ creatorId }: RevenueDashboardProps) {
  const [stats, setStats] = useState<RevenueStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    tipCount: 0,
    supporterCount: 0,
    topSupporters: [],
    recentTips: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRevenueStats()
  }, [creatorId])

  const loadRevenueStats = async () => {
    setLoading(true)
    try {
      // TODO: Fetch from API
      // const response = await fetch(`/api/payments/revenue/${creatorId}`)
      // const data = await response.json()
      // setStats(data)

      // Mock data for now
      setStats({
        totalEarnings: 1250,
        monthlyEarnings: 350,
        tipCount: 42,
        supporterCount: 8,
        topSupporters: [
          { username: '@supporter1', amount: 500 },
          { username: '@supporter2', amount: 300 },
          { username: '@supporter3', amount: 200 },
        ],
        recentTips: [
          {
            id: '1',
            amount: 500,
            supporter: '@generous_user',
            message: 'Love your content!',
            date: new Date().toISOString(),
          },
        ],
      })
    } catch (error) {
      console.error('Failed to load revenue stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12 text-gray-500">Loading revenue data...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Revenue Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your earnings from tips and supporters
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings * 100)}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.monthlyEarnings * 100)}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Heart className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Tips</span>
          </div>
          <div className="text-2xl font-bold">{stats.tipCount}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Supporters</span>
          </div>
          <div className="text-2xl font-bold">{stats.supporterCount}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Supporters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h2 className="text-lg font-semibold mb-4">Top Supporters</h2>
          {stats.topSupporters.length === 0 ? (
            <p className="text-sm text-gray-500">No supporters yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topSupporters.map((supporter, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{supporter.username}</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(supporter.amount * 100)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tips */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h2 className="text-lg font-semibold mb-4">Recent Tips</h2>
          {stats.recentTips.length === 0 ? (
            <p className="text-sm text-gray-500">No tips received yet</p>
          ) : (
            <div className="space-y-4">
              {stats.recentTips.map((tip) => (
                <div key={tip.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{tip.supporter}</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(tip.amount)}
                    </span>
                  </div>
                  {tip.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      "{tip.message}"
                    </p>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(tip.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h4 className="font-semibold mb-2">💰 Payout Information</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Earnings are automatically transferred to your connected Stripe account weekly.
          Platform fee: 5% (to cover server costs). Stripe fee: 2.9% + $0.30 per transaction.
        </p>
      </div>
    </div>
  )
}
