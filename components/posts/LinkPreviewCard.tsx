// ABOUTME: Link preview card component for displaying rich URL previews in posts
// ABOUTME: Shows title, description, image, and site name from Open Graph metadata

'use client'

import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import type { LinkPreview } from '@/lib/utils/link-preview'

interface LinkPreviewCardProps {
  preview: LinkPreview
}

export function LinkPreviewCard({ preview }: LinkPreviewCardProps) {
  const handleClick = () => {
    window.open(preview.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      onClick={handleClick}
      className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      {/* Preview Image */}
      {preview.image && (
        <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-900">
          <Image
            src={preview.image}
            alt={preview.title || 'Link preview'}
            fill
            className="object-cover"
            unoptimized // External images
          />
        </div>
      )}

      {/* Preview Content */}
      <div className="p-3">
        {/* Site Name */}
        {preview.siteName && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            {preview.favicon && (
              <Image
                src={preview.favicon}
                alt=""
                width={16}
                height={16}
                className="rounded"
                unoptimized
              />
            )}
            <span>{preview.siteName}</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        )}

        {/* Title */}
        {preview.title && (
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
            {preview.title}
          </h3>
        )}

        {/* Description */}
        {preview.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {preview.description}
          </p>
        )}

        {/* URL */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
          {preview.url}
        </p>
      </div>
    </div>
  )
}
