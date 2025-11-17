import { Button } from '@/components/ui/button'
import { Pause, Play } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface PlaybackControlsProps {
  currentTime: number
  duration: number
  isLoaded: boolean
  isPlaying: boolean
  onSeek: (time: number) => void
  onTogglePlayback: () => void
}

export function PlaybackControls({
  currentTime,
  duration,
  isLoaded,
  isPlaying,
  onSeek,
  onTogglePlayback,
}: PlaybackControlsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)

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
      <div className="flex items-center justify-center gap-4 border-t p-4">
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
      </div>
    </div>
  )
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
