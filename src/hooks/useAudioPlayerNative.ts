import { useRef, useEffect, useCallback, useState } from 'react'
import { getAudioFile } from '../lib/storage'

interface UseAudioPlayerProps {
  audioFileId: string | null
  isPlaying: boolean
  onPlaybackEnd?: () => void
}

interface AudioPlayerState {
  currentTime: number
  duration: number
  isLoaded: boolean
  error: string | null
}

export function useAudioPlayerNative({
  audioFileId,
  isPlaying,
  onPlaybackEnd,
}: UseAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const onPlaybackEndRef = useRef(onPlaybackEnd)

  const [state, setState] = useState<AudioPlayerState>({
    currentTime: 0,
    duration: 0,
    isLoaded: false,
    error: null,
  })

  // Keep ref in sync
  onPlaybackEndRef.current = onPlaybackEnd

  // Load the audio file
  useEffect(() => {
    if (!audioFileId) {
      setState((prev) => ({ ...prev, isLoaded: false, error: null }))
      return
    }

    let cancelled = false

    // Cleanup previous audio element and blob URL
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }

    async function loadAudio() {
      try {
        if (!audioFileId) return
        const file = await getAudioFile(audioFileId)
        if (!file || cancelled) return

        // Create blob URL from the file
        const blobUrl = URL.createObjectURL(file)
        blobUrlRef.current = blobUrl

        // Create audio element
        const audio = new Audio()
        audioRef.current = audio

        // Set up event listeners
        audio.addEventListener('loadedmetadata', () => {
          if (cancelled) return
          setState({
            currentTime: 0,
            duration: audio.duration,
            isLoaded: true,
            error: null,
          })
        })

        audio.addEventListener('timeupdate', () => {
          if (cancelled) return
          setState((prev) => ({
            ...prev,
            currentTime: audio.currentTime,
          }))
        })

        audio.addEventListener('ended', () => {
          if (cancelled) return
          onPlaybackEndRef.current?.()
        })

        audio.addEventListener('error', () => {
          if (cancelled) return
          setState((prev) => ({
            ...prev,
            isLoaded: false,
            error: audio.error?.message ?? 'Failed to load audio',
          }))
        })

        // Start loading
        audio.src = blobUrl
        audio.load()
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isLoaded: false,
            error: error instanceof Error ? error.message : 'Failed to load audio',
          }))
        }
      }
    }

    loadAudio()

    return () => {
      cancelled = true
    }
  }, [audioFileId])

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !state.isLoaded) return

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error('Playback error:', error)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, state.isLoaded])

  // Seek to a specific time
  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current
      if (!audio) return

      const clampedTime = Math.max(0, Math.min(time, state.duration))
      audio.currentTime = clampedTime
      setState((prev) => ({ ...prev, currentTime: clampedTime }))
    },
    [state.duration]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [])

  return {
    ...state,
    seek,
  }
}
