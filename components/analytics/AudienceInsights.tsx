// ABOUTME: Audience insights and demographics component
// ABOUTME: Location, interests, active hours, device types

'use client'

import { useState } from 'react'
import { MapPin, Clock, Smartphone, TrendingUp } from 'lucide-react'

interface DemographicData {
  topLocations: Array<{ location: string; count: number; percentage: number }>
  topInterests: Array<{ interest: string; count: number }>
  activeHours: Array<{ hour: number; count: number }>
  deviceTypes: { mobile: number; desktop: number; tablet: number }
}

interface AudienceInsightsProps {
  userId: string
}

export function AudienceInsights({ userId }: AudienceInsightsProps) {
  const [demographics, setDemographics] = useState<DemographicData>({
    topLocations: [
      { location: 'United States', count: 245, percentage: 47 },
      { location: 'United Kingdom', count: 98, percentage: 19 },
      { location: 'Canada', count: 67, percentage: 13 },
      { location: 'Australia', count: 45, percentage: 9 },
      { location: 'Germany', count: 31, percentage: 6 },
    ],
    topInterests: [
      { interest: 'Technology', count: 312 },
      { interest: 'Startup', count: 256 },
      { interest: 'Design', count: 198 },
      { interest: 'Programming', count: 187 },
      { interest: 'AI/ML', count: 143 },
    ],
    activeHours: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 100),
    })),
    deviceTypes: { mobile: 62, desktop: 31, tablet: 7 },
  })

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour} ${period}`
  }

  const maxActiveCount = Math.max(...demographics.activeHours.map((h) => h.count))

  return (
    <div className="space-y-6">
      {/* Top Locations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Top Locations
        </h3>
        <div className="space-y-3">
          {demographics.topLocations.map((location, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="text-2xl font-bold text-gray-300 w-6">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{location.location}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {location.count} ({location.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${location.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Interests */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Interests
        </h3>
        <div className="flex flex-wrap gap-2">
          {demographics.topInterests.map((interest, index) => (
            <div
              key={index}
              className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full font-medium text-sm"
            >
              {interest.interest} ({interest.count})
            </div>
          ))}
        </div>
      </div>

      {/* Active Hours */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Most Active Hours
        </h3>
        <div className="flex items-end gap-1 h-32">
          {demographics.activeHours.map((hour) => (
            <div
              key={hour.hour}
              className="flex-1 bg-blue-600 rounded-t hover:bg-blue-700 transition-colors cursor-pointer group relative"
              style={{
                height: `${(hour.count / maxActiveCount) * 100}%`,
                minHeight: '4px',
              }}
              title={`${formatHour(hour.hour)}: ${hour.count} active users`}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {formatHour(hour.hour)}: {hour.count}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>11 PM</span>
        </div>
      </div>

      {/* Device Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Device Types
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(demographics.deviceTypes).map(([device, percentage]) => (
            <div key={device} className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {percentage}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {device}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
