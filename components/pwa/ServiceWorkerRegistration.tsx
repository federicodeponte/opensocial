// ABOUTME: Client component to register service worker
// ABOUTME: Runs on mount to register PWA service worker

'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa/register-sw'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker()
    }
  }, [])

  return null
}
