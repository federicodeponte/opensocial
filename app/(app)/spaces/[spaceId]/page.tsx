// ABOUTME: Audio space room - live audio conversation with WebRTC P2P
// ABOUTME: Join, speak, listen in real-time audio spaces

'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useAudioSpace,
  useJoinAudioSpace,
  useLeaveAudioSpace,
  useEndAudioSpace,
  useAudioSpaceConnection,
} from '@/lib/hooks/useAudioSpaces'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/useAuth'

export default function AudioSpaceRoomPage({
  params,
}: {
  params: Promise<{ spaceId: string }>
}) {
  const { spaceId } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const { data: space, isLoading } = useAudioSpace(spaceId)
  const joinSpace = useJoinAudioSpace()
  const leaveSpace = useLeaveAudioSpace()
  const endSpace = useEndAudioSpace()

  const [hasJoined, setHasJoined] = useState(false)
  const { isConnected, isMuted, peerStreams, connect, disconnect, toggleMute } =
    useAudioSpaceConnection(hasJoined ? spaceId : null)

  const isHost = user && space && space.host_id === user.id

  const handleJoin = async () => {
    try {
      await joinSpace.mutateAsync(spaceId)
      setHasJoined(true)
      await connect()
    } catch (error) {
      console.error('Failed to join:', error)
    }
  }

  const handleLeave = async () => {
    try {
      disconnect()
      await leaveSpace.mutateAsync(spaceId)
      setHasJoined(false)
      router.push('/spaces')
    } catch (error) {
      console.error('Failed to leave:', error)
    }
  }

  const handleEnd = async () => {
    if (!confirm('Are you sure you want to end this space?')) return

    try {
      disconnect()
      await endSpace.mutateAsync(spaceId)
      router.push('/spaces')
    } catch (error) {
      console.error('Failed to end space:', error)
    }
  }

  // Auto-play peer audio streams
  useEffect(() => {
    peerStreams.forEach((stream, userId) => {
      const audioElement = document.getElementById(`audio-${userId}`) as HTMLAudioElement
      if (audioElement && audioElement.srcObject !== stream) {
        audioElement.srcObject = stream
        audioElement.play().catch((e) => console.error('Failed to play audio:', e))
      }
    })
  }, [peerStreams])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">Loading space...</div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Space not found</p>
            <Button onClick={() => router.push('/spaces')}>Back to Spaces</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {space.status === 'live' && (
                  <Badge className="bg-red-500">
                    <span className="animate-pulse mr-1">●</span> LIVE
                  </Badge>
                )}
                {isHost && <Badge variant="outline">Host</Badge>}
              </div>
              <CardTitle className="text-2xl">{space.title}</CardTitle>
              {space.description && (
                <CardDescription className="mt-2 text-base">{space.description}</CardDescription>
              )}
            </div>
            <Button variant="outline" onClick={() => router.push('/spaces')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Participants grid */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            Participants ({space.participant_count || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {space.participants?.map((participant) => (
              <div
                key={participant.id}
                className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl mb-2">
                  {participant.user?.display_name?.[0]?.toUpperCase() ||
                   participant.user?.username[0].toUpperCase() || '?'}
                </div>
                <div className="text-sm font-medium text-center">
                  {participant.user?.display_name || participant.user?.username}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {participant.role === 'host' && (
                    <Badge variant="outline" className="text-xs">Host</Badge>
                  )}
                  {participant.role === 'speaker' && (
                    <Badge variant="outline" className="text-xs">Speaker</Badge>
                  )}
                  {participant.is_muted && (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  )}
                  {participant.is_connected && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="sticky bottom-6">
        <CardContent className="pt-6">
          {!hasJoined ? (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Join this space to listen and participate
              </p>
              <Button
                size="lg"
                onClick={handleJoin}
                disabled={joinSpace.isPending}
                className="px-8"
              >
                {joinSpace.isPending ? 'Joining...' : 'Join Space'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              {/* Mute/Unmute */}
              <Button
                size="lg"
                variant={isMuted ? 'outline' : 'default'}
                onClick={toggleMute}
                className="px-6"
              >
                {isMuted ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    Unmute
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Mute
                  </>
                )}
              </Button>

              {/* Leave */}
              <Button
                size="lg"
                variant="outline"
                onClick={handleLeave}
                className="px-6"
              >
                Leave
              </Button>

              {/* End (host only) */}
              {isHost && (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleEnd}
                  className="px-6"
                >
                  End Space
                </Button>
              )}
            </div>
          )}

          {/* Connection status */}
          {hasJoined && (
            <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Connected ({peerStreams.size} peers)
                </span>
              ) : (
                <span>Connecting...</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden audio elements for peer streams */}
      {Array.from(peerStreams.keys()).map((userId) => (
        <audio key={userId} id={`audio-${userId}`} autoPlay />
      ))}
    </div>
  )
}
