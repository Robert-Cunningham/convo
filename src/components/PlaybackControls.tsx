import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/time'
import type { TranscriptToolMode } from '@/types'
import { MousePointer2, Pause, Play, TextSelect } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const PLAYBACK_RATES = [1, 1.5, 2, 2.5, 3] as const

interface PlaybackControlsProps {
  currentTime: number
  duration: number
  isLoaded: boolean
  isPlaying: boolean
  playbackRate: number
  toolMode: TranscriptToolMode
  onSeek: (time: number) => void
  onTogglePlayback: () => void
  onPlaybackRateChange: (rate: number) => void
  onToolModeChange: (mode: TranscriptToolMode) => void
}

export function PlaybackControls({
  currentTime,
  duration,
  isLoaded,
  isPlaying,
  playbackRate,
  toolMode,
  onSeek,
  onTogglePlayback,
  onPlaybackRateChange,
  onToolModeChange,
}: PlaybackControlsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const cyclePlaybackRate = useCallback(() => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate as typeof PLAYBACK_RATES[number])
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length
    onPlaybackRateChange(PLAYBACK_RATES[nextIndex])
  }, [playbackRate, onPlaybackRateChange])

  const handleSeek = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current || !isLoaded || duration === 0) return
      const rect = progressBarRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      onSeek(percentage * duration)
    },
    [isLoaded, duration, onSeek]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isLoaded) return
      setIsDragging(true)
      handleSeek(e.clientX)
    },
    [isLoaded, handleSeek]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      handleSeek(e.clientX)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleSeek])

  return (
    <div className="sticky bottom-0 z-10 flex flex-col bg-background">
      {/* Seekable Progress Bar - Edge to Edge */}
      <div
        ref={progressBarRef}
        className={`relative h-1 w-full bg-secondary ${isLoaded ? 'cursor-pointer' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div
          className="h-full bg-primary"
          style={{
            width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
          }}
        />
        {/* Draggable thumb */}
        {isLoaded && (
          <div
            className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary shadow-md transition-transform ${
              isDragging ? 'scale-125' : 'hover:scale-110'
            }`}
            style={{
              left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 6px)`,
            }}
          />
        )}
      </div>
      {/* Controls */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-t p-4">
        <div className="flex justify-start">
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            <Button
              variant={toolMode === 'pointer' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => onToolModeChange('pointer')}
              aria-pressed={toolMode === 'pointer'}
              title="Pointer tool"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              variant={toolMode === 'select' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => onToolModeChange('select')}
              aria-pressed={toolMode === 'select'}
              title="Select text tool"
            >
              <TextSelect className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm text-muted-foreground">{formatTime(currentTime)}</span>
          <Button
            size="lg"
            className="rounded-full"
            onClick={onTogglePlayback}
            disabled={!isLoaded}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <span className="text-sm text-muted-foreground">{formatTime(duration)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={cyclePlaybackRate}
            disabled={!isLoaded}
            className="min-w-[3.5rem] font-mono"
          >
            {playbackRate}x
          </Button>
        </div>
        <div />
      </div>
    </div>
  )
}
