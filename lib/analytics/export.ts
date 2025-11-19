// ABOUTME: Analytics data export utilities
// ABOUTME: Export analytics to CSV, JSON formats

import type { PostAnalytics, UserAnalytics } from './metrics'

/**
 * Convert data to CSV format
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) return ''

  const keys = headers || Object.keys(data[0])
  const headerRow = keys.join(',')

  const rows = data.map((item) =>
    keys
      .map((key) => {
        const value = item[key]
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(',')
  )

  return [headerRow, ...rows].join('\n')
}

/**
 * Export post analytics to CSV
 */
export function exportPostAnalyticsCSV(posts: PostAnalytics[]): string {
  return convertToCSV(posts, [
    'postId',
    'impressions',
    'engagements',
    'likes',
    'retweets',
    'replies',
    'clicks',
    'engagementRate',
    'reach',
    'createdAt',
  ])
}

/**
 * Export user analytics to CSV
 */
export function exportUserAnalyticsCSV(analytics: UserAnalytics): string {
  const summary = [
    {
      metric: 'Followers',
      value: analytics.followers,
    },
    {
      metric: 'Following',
      value: analytics.following,
    },
    {
      metric: 'Posts',
      value: analytics.posts,
    },
    {
      metric: 'Total Impressions',
      value: analytics.totalImpressions,
    },
    {
      metric: 'Total Engagements',
      value: analytics.totalEngagements,
    },
    {
      metric: 'Avg Engagement Rate',
      value: `${analytics.avgEngagementRate}%`,
    },
  ]

  return convertToCSV(summary)
}

/**
 * Download file from browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Export analytics as CSV
 */
export function exportAnalyticsCSV(data: any, filename: string) {
  const csv = Array.isArray(data)
    ? convertToCSV(data)
    : JSON.stringify(data, null, 2)

  downloadFile(csv, filename, 'text/csv')
}

/**
 * Export analytics as JSON
 */
export function exportAnalyticsJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, filename, 'application/json')
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: 'csv' | 'json'): string {
  const date = new Date().toISOString().split('T')[0]
  return `${prefix}-${date}.${extension}`
}
