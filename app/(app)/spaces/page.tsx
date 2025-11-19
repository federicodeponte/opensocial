// ABOUTME: Audio spaces list page - discover and create live audio rooms
// ABOUTME: FREE WebRTC P2P (Twitter Spaces clone)

'use client'

import { useState } from 'react'
import { useAudioSpaces, useCreateAudioSpace } from '@/lib/hooks/useAudioSpaces'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

export default function AudioSpacesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'active' | 'scheduled' | 'my-spaces'>('active')
  const { data: spaces, isLoading } = useAudioSpaces(filter)
  const createSpace = useCreateAudioSpace()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newSpaceTitle, setNewSpaceTitle] = useState('')
  const [newSpaceDescription, setNewSpaceDescription] = useState('')

  const handleCreateSpace = async () => {
    if (!newSpaceTitle.trim()) return

    try {
      const space = await createSpace.mutateAsync({
        title: newSpaceTitle,
        description: newSpaceDescription,
        isPublic: true,
        maxParticipants: 50,
      })

      setIsCreateDialogOpen(false)
      setNewSpaceTitle('')
      setNewSpaceDescription('')

      // Navigate to the space
      router.push(`/spaces/${space.id}`)
    } catch (error) {
      console.error('Failed to create space:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Audio Spaces</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Join live audio conversations
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start a Space
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Audio Space</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newSpaceTitle}
                  onChange={(e) => setNewSpaceTitle(e.target.value)}
                  placeholder="What's your space about?"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={newSpaceDescription}
                  onChange={(e) => setNewSpaceDescription(e.target.value)}
                  placeholder="Tell people what you'll talk about..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <Button
                onClick={handleCreateSpace}
                disabled={!newSpaceTitle.trim() || createSpace.isPending}
                className="w-full"
              >
                {createSpace.isPending ? 'Creating...' : 'Start Space'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="3" />
          </svg>
          Live Now
        </Button>
        <Button
          variant={filter === 'scheduled' ? 'default' : 'outline'}
          onClick={() => setFilter('scheduled')}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Scheduled
        </Button>
        <Button
          variant={filter === 'my-spaces' ? 'default' : 'outline'}
          onClick={() => setFilter('my-spaces')}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          My Spaces
        </Button>
      </div>

      {/* Cost savings banner */}
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-300">100% FREE Audio Spaces</h3>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                WebRTC P2P technology • No server costs • Unlimited rooms
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-800 dark:text-green-300">$0/mo</div>
              <div className="text-sm text-green-600 dark:text-green-500">vs $10-50/mo (Agora/Twilio)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spaces list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading spaces...</div>
      ) : spaces && spaces.length > 0 ? (
        <div className="space-y-4">
          {spaces.map((space) => (
            <Card
              key={space.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/spaces/${space.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {space.status === 'live' && (
                        <Badge className="bg-red-500">
                          <span className="animate-pulse mr-1">●</span> LIVE
                        </Badge>
                      )}
                      {space.status === 'scheduled' && (
                        <Badge variant="outline">Scheduled</Badge>
                      )}
                    </div>
                    <CardTitle>{space.title}</CardTitle>
                    {space.description && (
                      <CardDescription className="mt-2">{space.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {space.host && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                          {space.host.display_name?.[0]?.toUpperCase() || space.host.username[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{space.host.display_name || space.host.username}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{space.participant_count} listening</span>
                    </div>
                  </div>
                  <Button size="sm">Join</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filter === 'active' && 'No live spaces right now'}
              {filter === 'scheduled' && 'No scheduled spaces'}
              {filter === 'my-spaces' && "You haven't created any spaces yet"}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Start a Space
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
