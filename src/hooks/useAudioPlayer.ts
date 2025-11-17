import { useRef, useEffect, useCallback, useState } from 'react'
import { Input, ALL_FORMATS, BlobSource, AudioBufferSink } from 'mediabunny'
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

export function useAudioPlayer({
  audioFileId,
  isPlaying,
  onPlaybackEnd,
}: UseAudioPlayerProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const inputRef = useRef<Input | null>(null)
  const sinkRef = useRef<AudioBufferSink | null>(null)
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([])
  const playbackStartTimeRef = useRef<number>(0)
  const playbackOffsetRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const playbackCancelledRef = useRef<boolean>(false)
  const durationRef = useRef<number>(0)
  const onPlaybackEndRef = useRef(onPlaybackEnd)
  const isPlayingRef = useRef(isPlaying)

  const [state, setState] = useState<AudioPlayerState>({
    currentTime: 0,
    duration: 0,
    isLoaded: false,
    error: null,
  })
  const [seekCounter, setSeekCounter] = useState(0)

  // Keep refs in sync
  onPlaybackEndRef.current = onPlaybackEnd
  durationRef.current = state.duration
  isPlayingRef.current = isPlaying

  // Load the audio file
  useEffect(() => {
    if (!audioFileId) {
      setState((prev) => ({ ...prev, isLoaded: false, error: null }))
      return
    }

    let cancelled = false

    async function loadAudio() {
      try {
        if (!audioFileId) return
        const file = await getAudioFile(audioFileId)
        if (!file || cancelled) return

        const input = new Input({
          formats: ALL_FORMATS,
          source: new BlobSource(file),
        })

        const audioTrack = await input.getPrimaryAudioTrack()
        if (!audioTrack || cancelled) {
          throw new Error('No audio track found in file')
        }

        const duration = await audioTrack.computeDuration()
        const sink = new AudioBufferSink(audioTrack)

        inputRef.current = input
        sinkRef.current = sink

        if (!cancelled) {
          setState({
            currentTime: 0,
            duration,
            isLoaded: true,
            error: null,
          })
        }
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

  // Update current time during playback
  const updateCurrentTime = useCallback(() => {
    if (!audioContextRef.current || playbackCancelledRef.current) return

    const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current
    const newTime = playbackOffsetRef.current + elapsed

    setState((prev) => ({
      ...prev,
      currentTime: Math.min(newTime, prev.duration),
    }))

    if (newTime < durationRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateCurrentTime)
    } else {
      onPlaybackEndRef.current?.()
    }
  }, [])

  // Handle play/pause
  useEffect(() => {
    if (!state.isLoaded || !sinkRef.current) return

    async function startPlayback() {
      if (!sinkRef.current) return

      playbackCancelledRef.current = false

      // Create AudioContext if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      const audioContext = audioContextRef.current

      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      playbackStartTimeRef.current = audioContext.currentTime
      const startOffset = playbackOffsetRef.current

      // Schedule audio buffers for playback
      try {
        const bufferIterator = sinkRef.current.buffers(startOffset)
        const baseTime = audioContext.currentTime

        for await (const { buffer, timestamp } of bufferIterator) {
          // Check if playback was cancelled
          if (playbackCancelledRef.current) {
            break
          }

          const source = audioContext.createBufferSource()
          source.buffer = buffer
          source.connect(audioContext.destination)

          const scheduleTime = baseTime + (timestamp - startOffset)
          source.start(scheduleTime)

          scheduledSourcesRef.current.push(source)

          // Clean up completed sources
          source.onended = () => {
            const index = scheduledSourcesRef.current.indexOf(source)
            if (index > -1) {
              scheduledSourcesRef.current.splice(index, 1)
            }
          }
        }

        // Start updating current time (only if not cancelled)
        if (!playbackCancelledRef.current) {
          animationFrameRef.current = requestAnimationFrame(updateCurrentTime)
        }
      } catch (error) {
        console.error('Playback error:', error)
      }
    }

    function stopPlayback() {
      playbackCancelledRef.current = true

      // Stop all scheduled sources
      scheduledSourcesRef.current.forEach((source) => {
        try {
          source.stop()
        } catch {
          // Source may have already stopped
        }
      })
      scheduledSourcesRef.current = []

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Save current position
      if (audioContextRef.current && playbackStartTimeRef.current > 0) {
        const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current
        playbackOffsetRef.current = Math.min(
          playbackOffsetRef.current + elapsed,
          durationRef.current
        )
      }
    }

    if (isPlaying) {
      startPlayback()
    } else {
      stopPlayback()
    }

    return () => {
      stopPlayback()
    }
  }, [isPlaying, state.isLoaded, updateCurrentTime, seekCounter])

  // Seek to a specific time
  const seek = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, state.duration))
      playbackOffsetRef.current = clampedTime
      setState((prev) => ({ ...prev, currentTime: clampedTime }))
      // If currently playing, trigger restart from new position
      if (isPlayingRef.current) {
        setSeekCounter((c) => c + 1)
      }
    },
    [state.duration]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    ...state,
    seek,
  }
}
