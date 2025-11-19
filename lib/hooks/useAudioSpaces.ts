// ABOUTME: React hooks for audio spaces - create, join, manage spaces
// ABOUTME: FREE WebRTC P2P audio (Twitter Spaces clone)

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/auth/supabase-client'
import { WebRTCManager } from '@/lib/utils/webrtc-manager'
import { useEffect, useRef, useState, useCallback } from 'react'

export interface AudioSpace {
  id: string
  host_id: string
  title: string
  description?: string
  is_public: boolean
  max_participants: number
  status: 'scheduled' | 'live' | 'ended'
  started_at?: string
  ended_at?: string
  scheduled_for?: string
  participant_count: number
  peak_participants: number
  created_at: string
  host?: {
    id: string
    username: string
    display_name: string
    avatar_url?: string
  }
}

export interface SpaceParticipant {
  id: string
  space_id: string
  user_id: string
  role: 'host' | 'speaker' | 'listener'
  is_muted: boolean
  is_hand_raised: boolean
  is_connected: boolean
  joined_at: string
  user?: {
    id: string
    username: string
    display_name: string
    avatar_url?: string
  }
}

/**
 * List audio spaces
 */
export function useAudioSpaces(filter: 'active' | 'scheduled' | 'my-spaces' = 'active') {
  return useQuery({
    queryKey: ['audio-spaces', filter],
    queryFn: async () => {
      const res = await fetch(`/api/spaces?filter=${filter}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      return data.data as AudioSpace[]
    },
    refetchInterval: 10000, // Refresh every 10s for active spaces
  })
}

/**
 * Get single space details
 */
export function useAudioSpace(spaceId: string | null) {
  return useQuery({
    queryKey: ['audio-space', spaceId],
    queryFn: async () => {
      if (!spaceId) return null
      const res = await fetch(`/api/spaces/${spaceId}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      return data.data as AudioSpace & { participants: SpaceParticipant[] }
    },
    enabled: !!spaceId,
    refetchInterval: 5000, // Refresh every 5s
  })
}

/**
 * Create audio space
 */
export function useCreateAudioSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      title: string
      description?: string
      isPublic?: boolean
      maxParticipants?: number
      scheduledFor?: string
    }) => {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      return data.data as AudioSpace
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-spaces'] })
    },
  })
}

/**
 * Join audio space
 */
export function useJoinAudioSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (spaceId: string) => {
      const res = await fetch(`/api/spaces/${spaceId}/join`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      return data.data
    },
    onSuccess: (_data, spaceId) => {
      queryClient.invalidateQueries({ queryKey: ['audio-space', spaceId] })
      queryClient.invalidateQueries({ queryKey: ['audio-spaces'] })
    },
  })
}

/**
 * Leave audio space
 */
export function useLeaveAudioSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (spaceId: string) => {
      const res = await fetch(`/api/spaces/${spaceId}/join`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      return data.data
    },
    onSuccess: (_data, spaceId) => {
      queryClient.invalidateQueries({ queryKey: ['audio-space', spaceId] })
      queryClient.invalidateQueries({ queryKey: ['audio-spaces'] })
    },
  })
}

/**
 * End audio space (host only)
 */
export function useEndAudioSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (spaceId: string) => {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-spaces'] })
    },
  })
}

/**
 * WebRTC audio space connection hook
 */
export function useAudioSpaceConnection(spaceId: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [peerStreams, setPeerStreams] = useState<Map<string, MediaStream>>(new Map())
  const webrtcManager = useRef<WebRTCManager | null>(null)
  const supabase = createClient()

  // Initialize WebRTC manager
  useEffect(() => {
    if (!spaceId) return

    webrtcManager.current = new WebRTCManager(spaceId, {
      onPeerStream: (userId, stream) => {
        setPeerStreams((prev) => new Map(prev).set(userId, stream))
      },
      onPeerDisconnect: (userId) => {
        setPeerStreams((prev) => {
          const newMap = new Map(prev)
          newMap.delete(userId)
          return newMap
        })
      },
    })

    return () => {
      webrtcManager.current?.destroy()
      webrtcManager.current = null
    }
  }, [spaceId])

  // Connect to space
  const connect = useCallback(async () => {
    if (!spaceId || !webrtcManager.current) return

    try {
      // Get microphone access
      await webrtcManager.current.getLocalStream()
      setIsConnected(true)

      // Listen for signaling messages
      const channel = supabase
        .channel(`space:${spaceId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'signaling_messages',
            filter: `space_id=eq.${spaceId}`,
          },
          async (payload) => {
            const message = payload.new as any
            const currentUser = (await supabase.auth.getUser()).data.user

            if (!currentUser || message.from_user_id === currentUser.id) return

            if (message.message_type === 'offer') {
              // Accept peer connection
              await webrtcManager.current?.acceptPeerConnection(
                message.from_user_id,
                message.payload,
                async (signal) => {
                  // Send answer
                  await fetch(`/api/spaces/${spaceId}/signal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      toUserId: message.from_user_id,
                      messageType: 'answer',
                      payload: signal,
                    }),
                  })
                }
              )
            } else if (message.message_type === 'answer') {
              // Handle answer
              webrtcManager.current?.handleSignal(message.from_user_id, message.payload)
            } else if (message.message_type === 'ice-candidate') {
              // Handle ICE candidate
              webrtcManager.current?.handleSignal(message.from_user_id, message.payload)
            }
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      setIsConnected(false)
    }
  }, [spaceId, supabase])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!webrtcManager.current) return

    const muted = webrtcManager.current.toggleMute()
    setIsMuted(muted)
  }, [])

  // Disconnect from space
  const disconnect = useCallback(() => {
    webrtcManager.current?.destroy()
    setIsConnected(false)
    setPeerStreams(new Map())
  }, [])

  return {
    isConnected,
    isMuted,
    peerStreams,
    connect,
    disconnect,
    toggleMute,
  }
}
