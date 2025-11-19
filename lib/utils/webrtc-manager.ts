// ABOUTME: WebRTC connection manager for P2P audio (FREE alternative to Agora)
// ABOUTME: Handles peer connections, audio streams, signaling

import SimplePeer from 'simple-peer'

export interface PeerConnection {
  peer: SimplePeer.Instance
  userId: string
  stream?: MediaStream
}

export class WebRTCManager {
  private peers: Map<string, PeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private spaceId: string
  private onPeerStream?: (userId: string, stream: MediaStream) => void
  private onPeerDisconnect?: (userId: string) => void

  constructor(
    spaceId: string,
    callbacks?: {
      onPeerStream?: (userId: string, stream: MediaStream) => void
      onPeerDisconnect?: (userId: string) => void
    }
  ) {
    this.spaceId = spaceId
    this.onPeerStream = callbacks?.onPeerStream
    this.onPeerDisconnect = callbacks?.onPeerDisconnect
  }

  /**
   * Get user's microphone access
   */
  async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
      return this.localStream
    } catch (error) {
      console.error('Failed to get microphone access:', error)
      throw new Error('Microphone access denied')
    }
  }

  /**
   * Create a peer connection (initiator)
   */
  async createPeerConnection(
    userId: string,
    onSignal: (signal: SimplePeer.SignalData) => void
  ): Promise<void> {
    if (this.peers.has(userId)) {
      console.warn(`Peer connection already exists for ${userId}`)
      return
    }

    const localStream = await this.getLocalStream()

    const peer = new SimplePeer({
      initiator: true,
      stream: localStream,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }, // FREE Google STUN server
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      },
    })

    this.setupPeerListeners(peer, userId, onSignal)
    this.peers.set(userId, { peer, userId })
  }

  /**
   * Accept a peer connection (receiver)
   */
  async acceptPeerConnection(
    userId: string,
    signal: SimplePeer.SignalData,
    onSignal: (signal: SimplePeer.SignalData) => void
  ): Promise<void> {
    if (this.peers.has(userId)) {
      console.warn(`Peer connection already exists for ${userId}`)
      return
    }

    const localStream = await this.getLocalStream()

    const peer = new SimplePeer({
      initiator: false,
      stream: localStream,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      },
    })

    this.setupPeerListeners(peer, userId, onSignal)
    this.peers.set(userId, { peer, userId })

    // Signal the peer
    peer.signal(signal)
  }

  /**
   * Handle incoming signal from peer
   */
  handleSignal(userId: string, signal: SimplePeer.SignalData): void {
    const connection = this.peers.get(userId)
    if (!connection) {
      console.warn(`No peer connection found for ${userId}`)
      return
    }

    connection.peer.signal(signal)
  }

  /**
   * Setup peer event listeners
   */
  private setupPeerListeners(
    peer: SimplePeer.Instance,
    userId: string,
    onSignal: (signal: SimplePeer.SignalData) => void
  ): void {
    peer.on('signal', (signal) => {
      onSignal(signal)
    })

    peer.on('stream', (stream) => {
      const connection = this.peers.get(userId)
      if (connection) {
        connection.stream = stream
      }
      this.onPeerStream?.(userId, stream)
    })

    peer.on('error', (err) => {
      console.error(`Peer error for ${userId}:`, err)
      this.removePeer(userId)
    })

    peer.on('close', () => {
      console.log(`Peer connection closed for ${userId}`)
      this.removePeer(userId)
    })
  }

  /**
   * Remove peer connection
   */
  removePeer(userId: string): void {
    const connection = this.peers.get(userId)
    if (connection) {
      connection.peer.destroy()
      this.peers.delete(userId)
      this.onPeerDisconnect?.(userId)
    }
  }

  /**
   * Toggle microphone mute
   */
  toggleMute(): boolean {
    if (!this.localStream) return false

    const audioTracks = this.localStream.getAudioTracks()
    if (audioTracks.length === 0) return false

    const enabled = !audioTracks[0].enabled
    audioTracks.forEach((track) => {
      track.enabled = enabled
    })

    return !enabled // Return isMuted state
  }

  /**
   * Get mute status
   */
  isMuted(): boolean {
    if (!this.localStream) return true

    const audioTracks = this.localStream.getAudioTracks()
    if (audioTracks.length === 0) return true

    return !audioTracks[0].enabled
  }

  /**
   * Get all connected peers
   */
  getConnectedPeers(): string[] {
    return Array.from(this.peers.keys())
  }

  /**
   * Cleanup all connections
   */
  destroy(): void {
    // Destroy all peer connections
    this.peers.forEach((connection) => {
      connection.peer.destroy()
    })
    this.peers.clear()

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }
  }
}

/**
 * Audio level detection utility
 */
export class AudioLevelDetector {
  private audioContext: AudioContext
  private analyser: AnalyserNode
  private dataArray: Uint8Array

  constructor(stream: MediaStream) {
    this.audioContext = new AudioContext()
    const source = this.audioContext.createMediaStreamSource(stream)
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 256

    source.connect(this.analyser)
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
  }

  /**
   * Get current audio level (0-100)
   */
  getLevel(): number {
    this.analyser.getByteFrequencyData(this.dataArray)
    const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length
    return Math.round((average / 255) * 100)
  }

  /**
   * Check if user is speaking
   */
  isSpeaking(threshold = 30): boolean {
    return this.getLevel() > threshold
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.audioContext.close()
  }
}
