// ABOUTME: Analytics dashboard page
// ABOUTME: Comprehensive analytics and insights

import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { AudienceInsights } from '@/components/analytics/AudienceInsights'

export const metadata = {
  title: 'Analytics | OpenSocial',
  description: 'Track your performance and audience insights',
}

export default function AnalyticsPage() {
  // TODO: Get current user ID from auth
  const userId = 'current-user-id'

  return (
    <div className="space-y-8">
      <AnalyticsDashboard userId={userId} />

      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-bold mb-6">Audience Insights</h2>
        <AudienceInsights userId={userId} />
      </div>
    </div>
  )
}
