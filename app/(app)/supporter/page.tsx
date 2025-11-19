// ABOUTME: Supporter tiers page
// ABOUTME: Optional cosmetic upgrades (all features always free)

import { SupporterTiersCard } from '@/components/payments/SupporterTiersCard'

export const metadata = {
  title: 'Become a Supporter | OpenSocial',
  description: 'Support OpenSocial development with optional cosmetic upgrades',
}

export default function SupporterPage() {
  // TODO: Get current user ID and tier from auth
  const userId = undefined
  const currentTierId = null

  return <SupporterTiersCard userId={userId} currentTierId={currentTierId} />
}
