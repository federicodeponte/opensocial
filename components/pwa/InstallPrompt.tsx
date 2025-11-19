// ABOUTME: PWA install prompt component
// ABOUTME: Banner to encourage users to install the app

'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  setupInstallPrompt,
  showInstallPrompt,
  isAppInstalled,
  isInstallPromptAvailable,
  getDeviceType,
  getInstallInstructions,
} from '@/lib/pwa/install-prompt'

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isAppInstalled() || dismissed) {
      return
    }

    // Check if dismissed in this session
    const sessionDismissed = sessionStorage.getItem('install-prompt-dismissed')
    if (sessionDismissed) {
      setDismissed(true)
      return
    }

    // Setup install prompt listener
    setupInstallPrompt(() => {
      setShowPrompt(true)
    })

    // Show instructions for iOS (doesn't support beforeinstallprompt)
    if (getDeviceType() === 'ios') {
      setTimeout(() => {
        setShowInstructions(true)
      }, 3000)
    }
  }, [dismissed])

  const handleInstall = async () => {
    const result = await showInstallPrompt()

    if (result === 'accepted') {
      setShowPrompt(false)
    } else if (result === 'unavailable') {
      // Show instructions for manual install
      setShowInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowInstructions(false)
    setDismissed(true)
    sessionStorage.setItem('install-prompt-dismissed', 'true')
  }

  if (!showPrompt && !showInstructions) {
    return null
  }

  if (showInstructions) {
    const instructions = getInstallInstructions()
    const device = getDeviceType()

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg z-50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              <span className="font-semibold">Install OpenSocial</span>
            </div>
            <button onClick={handleDismiss} className="text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm mb-3">
            Get the best experience with our {device === 'ios' ? 'iOS' : device === 'android' ? 'Android' : 'desktop'} app:
          </p>

          <ol className="text-sm space-y-1 list-decimal list-inside mb-3">
            {instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>

          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Got it
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold">Install OpenSocial</div>
            <div className="text-sm text-white/90">
              Get the app for a better experience - works offline!
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-white text-blue-600 hover:bg-white/90"
          >
            Install
          </Button>
          <button onClick={handleDismiss} className="text-white/80 hover:text-white p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
