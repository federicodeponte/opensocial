// ABOUTME: Post content component with clickable hashtags and mentions
// ABOUTME: Renders text with parsed links, hashtags, and mentions

'use client'

import Link from 'next/link'
import { parseContentToSegments, ContentSegment } from '@/lib/parsers/content-parser'

interface PostContentProps {
  content: string
  className?: string
}

export function PostContent({ content, className = '' }: PostContentProps) {
  const segments = parseContentToSegments(content)

  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.content}</span>
        }

        if (segment.type === 'hashtag') {
          return (
            <Link
              key={index}
              href={segment.href!}
              className="text-blue-600 hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {segment.content}
            </Link>
          )
        }

        if (segment.type === 'mention') {
          return (
            <Link
              key={index}
              href={segment.href!}
              className="text-blue-600 hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {segment.content}
            </Link>
          )
        }

        if (segment.type === 'url') {
          return (
            <a
              key={index}
              href={segment.href!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {segment.content}
            </a>
          )
        }

        return null
      })}
    </div>
  )
}
