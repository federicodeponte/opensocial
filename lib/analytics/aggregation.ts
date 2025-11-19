// ABOUTME: Analytics data aggregation utilities
// ABOUTME: Aggregate metrics over time periods

export type TimePeriod = '7d' | '30d' | '90d' | 'all'

export interface TimeSeriesData {
  date: string
  value: number
}

export interface AnalyticsTimeRange {
  impressions: TimeSeriesData[]
  engagements: TimeSeriesData[]
  followers: TimeSeriesData[]
  posts: TimeSeriesData[]
}

/**
 * Aggregate data by day
 */
export function aggregateByDay<T extends { createdAt: string }>(
  data: T[],
  valueExtractor: (item: T) => number,
  days = 30
): TimeSeriesData[] {
  const now = new Date()
  const result: TimeSeriesData[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const dayData = data.filter((item) => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= date && itemDate < nextDate
    })

    const value = dayData.reduce((sum, item) => sum + valueExtractor(item), 0)

    result.push({
      date: date.toISOString().split('T')[0],
      value,
    })
  }

  return result
}

/**
 * Calculate cumulative data (for follower growth)
 */
export function calculateCumulative(data: TimeSeriesData[]): TimeSeriesData[] {
  let cumulative = 0
  return data.map((item) => {
    cumulative += item.value
    return {
      date: item.date,
      value: cumulative,
    }
  })
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  data: TimeSeriesData[],
  window = 7
): TimeSeriesData[] {
  return data.map((item, index) => {
    const start = Math.max(0, index - window + 1)
    const windowData = data.slice(start, index + 1)
    const avg =
      windowData.reduce((sum, d) => sum + d.value, 0) / windowData.length

    return {
      date: item.date,
      value: parseFloat(avg.toFixed(2)),
    }
  })
}

/**
 * Get analytics for time period
 */
export function getAnalyticsForPeriod(
  period: TimePeriod
): { days: number; label: string } {
  switch (period) {
    case '7d':
      return { days: 7, label: 'Last 7 days' }
    case '30d':
      return { days: 30, label: 'Last 30 days' }
    case '90d':
      return { days: 90, label: 'Last 90 days' }
    case 'all':
      return { days: 365, label: 'All time' }
  }
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): { value: number; isPositive: boolean } {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current > 0 }
  }

  const change = ((current - previous) / previous) * 100
  return {
    value: parseFloat(Math.abs(change).toFixed(2)),
    isPositive: change >= 0,
  }
}

/**
 * Get period comparison
 */
export function getPeriodComparison(
  currentData: TimeSeriesData[],
  metric: string
): {
  current: number
  previous: number
  change: { value: number; isPositive: boolean }
  label: string
} {
  const midpoint = Math.floor(currentData.length / 2)
  const firstHalf = currentData.slice(0, midpoint)
  const secondHalf = currentData.slice(midpoint)

  const previousTotal = firstHalf.reduce((sum, d) => sum + d.value, 0)
  const currentTotal = secondHalf.reduce((sum, d) => sum + d.value, 0)

  return {
    current: currentTotal,
    previous: previousTotal,
    change: calculatePercentageChange(currentTotal, previousTotal),
    label: metric,
  }
}
