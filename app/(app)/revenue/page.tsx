// ABOUTME: Creator revenue dashboard page
// ABOUTME: Track tips and earnings

import { RevenueDashboard } from '@/components/payments/RevenueDashboard'

export const metadata = {
  title: 'Revenue Dashboard | OpenSocial',
  description: 'Track your creator earnings',
}

export default function RevenuePage() {
  // TODO: Get current user ID from auth
  const creatorId = 'current-user-id'

  return <RevenueDashboard creatorId={creatorId} />
}
