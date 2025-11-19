// ABOUTME: Admin moderation dashboard to review reported content
// ABOUTME: Shows pending reports with auto-moderation results

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Report {
  id: string
  content_type: string
  content_id: string
  reason: string
  description: string
  status: string
  created_at: string
  reported_by: string
}

export default function ModerationDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/reports?status=${filter}&limit=50`)
      const data = await res.json()
      
      if (data.success) {
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-500',
      harassment: 'bg-red-500',
      hate_speech: 'bg-red-700',
      violence: 'bg-red-900',
      misinformation: 'bg-orange-500',
      nsfw: 'bg-pink-500',
      other: 'bg-gray-500',
    }
    return colors[reason] || 'bg-gray-500'
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Content Moderation</h1>
        <p className="text-muted-foreground">
          Review and moderate reported content
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
        >
          Approved
        </Button>
        <Button
          variant={filter === 'rejected' ? 'default' : 'outline'}
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </Button>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No {filter} reports found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getReasonBadge(report.reason)}>
                      {report.reason.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {report.content_type}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {report.description && (
                  <p className="text-sm mb-4">{report.description}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="default">
                    View Content
                  </Button>
                  <Button size="sm" variant="outline">
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive">
                    Remove Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Moderation Stats</CardTitle>
          <CardDescription>
            Auto-moderation is active using FREE tools (bad-words, spam detection)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">{reports.length}</div>
              <div className="text-sm text-muted-foreground">Total Reports</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">Auto-Moderated</div>
              <div className="text-sm text-muted-foreground">Using FREE tools</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">$0/month</div>
              <div className="text-sm text-muted-foreground">No AI costs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
