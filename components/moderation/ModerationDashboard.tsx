// ABOUTME: Moderation dashboard for admins
// ABOUTME: View flagged content and take moderation actions

'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FlaggedContent {
  id: string
  type: 'post' | 'comment' | 'image'
  content: string
  author: string
  flaggedAt: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  categories: string[]
  action: 'allow' | 'warn' | 'block' | 'review'
  explanation?: string
}

export function ModerationDashboard() {
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'actioned'>('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFlaggedContent()
  }, [filter])

  const loadFlaggedContent = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/moderation/flagged?filter=${filter}`)
      // const data = await response.json()
      // setFlaggedContent(data.flagged)

      // Mock data for now
      setFlaggedContent([
        {
          id: '1',
          type: 'post',
          content: 'Example flagged content...',
          author: '@user123',
          flaggedAt: new Date().toISOString(),
          severity: 'medium',
          categories: ['spam'],
          action: 'review',
          explanation: 'Detected spam patterns',
        },
      ])
    } catch (error) {
      console.error('Failed to load flagged content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (contentId: string, action: 'approve' | 'remove' | 'warn') => {
    try {
      // TODO: Implement actual moderation action API
      // await fetch(`/api/moderation/action`, {
      //   method: 'POST',
      //   body: JSON.stringify({ contentId, action }),
      // })

      // Remove from list after action
      setFlaggedContent((prev) => prev.filter((item) => item.id !== contentId))
    } catch (error) {
      console.error('Failed to take action:', error)
    }
  }

  const getSeverityColor = (severity: FlaggedContent['severity']) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'critical':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getSeverityIcon = (severity: FlaggedContent['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      default:
        return <Eye className="h-5 w-5 text-yellow-500" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Content Moderation</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review and manage flagged content
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending ({flaggedContent.filter((c) => c.action === 'review').length})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : flaggedContent.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-semibold">All Clear!</p>
          <p className="text-gray-600 dark:text-gray-400">No flagged content to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flaggedContent.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{getSeverityIcon(item.severity)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${getSeverityColor(
                        item.severity
                      )}`}
                    >
                      {item.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.type}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      by {item.author}
                    </span>
                  </div>

                  <p className="text-sm mb-2 line-clamp-2">{item.content}</p>

                  <div className="flex items-center gap-2 mb-2">
                    {item.categories.map((category) => (
                      <span
                        key={category}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  {item.explanation && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.explanation}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(item.id, 'approve')}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(item.id, 'warn')}
                    className="gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Warn
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(item.id, 'remove')}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
