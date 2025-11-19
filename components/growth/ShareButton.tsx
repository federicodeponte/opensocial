// ABOUTME: Social sharing button component
// ABOUTME: Share to Twitter, Facebook, LinkedIn, WhatsApp, Reddit

'use client'

import { useState } from 'react'
import { Share2, Twitter, Facebook, Linkedin, MessageCircle, Link2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  shareToTwitter,
  shareToFacebook,
  shareToLinkedIn,
  shareToWhatsApp,
  shareToReddit,
  copyToClipboard,
  nativeShare,
  trackShareEvent,
  type ShareData,
} from '@/lib/growth/social-sharing'
import { toast } from 'sonner'

interface ShareButtonProps {
  data: ShareData
  contentType: 'post' | 'profile'
  contentId: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export function ShareButton({
  data,
  contentType,
  contentId,
  variant = 'ghost',
  size = 'sm',
  showLabel = false,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async (platform: string, shareFn: () => void | Promise<void>) => {
    try {
      await shareFn()
      trackShareEvent(platform, contentType, contentId)
      toast.success(`Shared to ${platform}!`)
    } catch (error) {
      console.error(`Failed to share to ${platform}:`, error)
    }
  }

  const handleCopyLink = async () => {
    const success = await copyToClipboard(data.url)
    if (success) {
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
      trackShareEvent('copy_link', contentType, contentId)
    } else {
      toast.error('Failed to copy link')
    }
  }

  const handleNativeShare = async () => {
    const success = await nativeShare(data)
    if (success) {
      trackShareEvent('native_share', contentType, contentId)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="h-4 w-4" />
          {showLabel && <span className="ml-2">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {typeof navigator !== 'undefined' && typeof navigator.share !== 'undefined' && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share via...
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => handleShare('Twitter', () => shareToTwitter(data))}
        >
          <Twitter className="mr-2 h-4 w-4" />
          Share on Twitter
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('Facebook', () => shareToFacebook(data.url))}
        >
          <Facebook className="mr-2 h-4 w-4" />
          Share on Facebook
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('LinkedIn', () => shareToLinkedIn(data))}
        >
          <Linkedin className="mr-2 h-4 w-4" />
          Share on LinkedIn
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('WhatsApp', () => shareToWhatsApp(data))}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Share on WhatsApp
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare('Reddit', () => shareToReddit(data))}
        >
          <div className="mr-2 h-4 w-4 flex items-center justify-center text-orange-500">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm4.5 8.5c-.828 0-1.5.672-1.5 1.5 0 .276.083.532.2.76-.92.456-2.08.74-3.4.74-1.32 0-2.48-.284-3.4-.74.117-.228.2-.484.2-.76 0-.828-.672-1.5-1.5-1.5-.456 0-.864.204-1.14.524C5.592 8.768 7.676 8 10 8c2.324 0 4.408.768 5.64 2.024-.276-.32-.684-.524-1.14-.524z" />
            </svg>
          </div>
          Share on Reddit
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Link2 className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Link copied!' : 'Copy link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
