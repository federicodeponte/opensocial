// ABOUTME: PWA install prompt utilities
// ABOUTME: Detect and trigger install prompts for mobile/desktop

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

/**
 * Setup install prompt listener
 */
export function setupInstallPrompt(
  onPromptAvailable?: (prompt: BeforeInstallPromptEvent) => void
) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent

    if (onPromptAvailable) {
      onPromptAvailable(deferredPrompt)
    }
  })

  // Listen for successful install
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    console.log('PWA installed successfully')
  })
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    return 'unavailable'
  }

  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice

  deferredPrompt = null
  return outcome
}

/**
 * Check if app is installed
 */
export function isAppInstalled(): boolean {
  // Check if running in standalone mode
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

/**
 * Check if install prompt is available
 */
export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null
}

/**
 * Get device type for install instructions
 */
export function getDeviceType(): 'ios' | 'android' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase()

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios'
  }

  if (/android/.test(userAgent)) {
    return 'android'
  }

  return 'desktop'
}

/**
 * Get install instructions for device
 */
export function getInstallInstructions(): string[] {
  const device = getDeviceType()

  switch (device) {
    case 'ios':
      return [
        'Tap the Share button',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to install',
      ]

    case 'android':
      return [
        'Tap the menu button (⋮)',
        'Tap "Install app" or "Add to Home screen"',
        'Follow the prompts to install',
      ]

    case 'desktop':
      return [
        'Click the install icon in the address bar',
        'Click "Install" in the popup',
        'The app will open in a new window',
      ]
  }
}
