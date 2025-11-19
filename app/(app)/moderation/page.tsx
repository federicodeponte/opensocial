// ABOUTME: Moderation dashboard page for admins
// ABOUTME: Content safety and moderation management

import { ModerationDashboard } from '@/components/moderation/ModerationDashboard'

export const metadata = {
  title: 'Moderation Dashboard | OpenSocial',
  description: 'Manage and review flagged content',
}

export default function ModerationPage() {
  return <ModerationDashboard />
}
