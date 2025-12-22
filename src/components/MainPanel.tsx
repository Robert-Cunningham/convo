import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAudioPlayerNative as useAudioPlayer } from '@/hooks/useAudioPlayerNative'
import { isTranscribing, selectSnippet, selectTemporarySnippet, setIsPlaying, useAppStore, useSnippets, useTranscript, useTranscriptLoading } from '@/store'
import { retryProject } from '@/project'
import type { TranscriptWord } from '@/types'
import { AlertCircle, FileAudio, RefreshCw, Settings } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatTime, PlaybackControls } from './PlaybackControls'
import { SpeakersPanel } from './SpeakersPanel'

interface WordPosition {
  segmentIndex: number
  wordIndex: number
  word: TranscriptWord
}

export function MainPanel() {
  const projects = useAppStore((state) => state.projects)
  const selectedProjectId = useAppStore((state) => state.selectedProjectId)
  const transcript = useTranscript()
  const snippets = useSnippets()
  const isPlaying = useAppStore((state) => state.isPlaying)
  const togglePlayback = useAppStore((state) => state.togglePlayback)

  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const isTranscriptLoading = useTranscriptLoading()

  // Selection state for snippet creation
  const [selectionStart, setSelectionStart] = useState<WordPosition | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<WordPosition | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [hoverPosition, setHoverPosition] = useState<WordPosition | null>(null)

  // Refs for auto-scroll on play
  const wordRefs = useRef<Map<string, HTMLSpanElement>>(new Map())
  const prevIsPlayingRef = useRef(false)

  // Audio player hook
  const { currentTime, duration, isLoaded, playbackRate, seek, setPlaybackRate } = useAudioPlayer({
    audioFileId: selectedProject?.audioFileId ?? null,
    isPlaying,
    onPlaybackEnd: () => setIsPlaying(false),
  })

  // Reset selection state when project changes
  useEffect(() => {
    setSelectionStart(null)
    setSelectionEnd(null)
    setIsSelecting(false)
    setHoverPosition(null)
  }, [selectedProjectId])

  // Flatten all words with their positions for easier comparison
  const allWords = useMemo(() => {
    const words: WordPosition[] = []
    transcript.forEach((segment, segmentIndex) => {
      segment.words?.forEach((word, wordIndex) => {
        words.push({ segmentIndex, wordIndex, word })
      })
    })
    return words
  }, [transcript])

  // Auto-scroll to current position when playback starts
  useEffect(() => {
    if (isPlaying && !prevIsPlayingRef.current && allWords.length > 0) {
      // Find the word at or after the current time
      const currentWordIndex = allWords.findIndex(
        (wp) => wp.word.start <= currentTime && wp.word.end >= currentTime
      )
      // If no exact match, find the next word after current time
      const targetIndex = currentWordIndex >= 0
        ? currentWordIndex
        : allWords.findIndex((wp) => wp.word.start >= currentTime)

      if (targetIndex >= 0) {
        const wp = allWords[targetIndex]
        const key = `${wp.segmentIndex}-${wp.wordIndex}`
        const element = wordRefs.current.get(key)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
    prevIsPlayingRef.current = isPlaying
  }, [isPlaying, currentTime, allWords])

  // Get global index of a word position
  const getGlobalIndex = useCallback((pos: WordPosition) => {
    let index = 0
    for (let s = 0; s < pos.segmentIndex; s++) {
      index += transcript[s]?.words?.length ?? 0
    }
    return index + pos.wordIndex
  }, [transcript])

  // Check if a word is within the current selection range
  const isWordInSelection = useCallback((pos: WordPosition) => {
    if (!selectionStart) return false

    const endPos = isSelecting ? hoverPosition : selectionEnd
    if (!endPos) return false

    const startIdx = getGlobalIndex(selectionStart)
    const endIdx = getGlobalIndex(endPos)
    const currentIdx = getGlobalIndex(pos)

    const minIdx = Math.min(startIdx, endIdx)
    const maxIdx = Math.max(startIdx, endIdx)

    return currentIdx >= minIdx && currentIdx <= maxIdx
  }, [selectionStart, selectionEnd, isSelecting, hoverPosition, getGlobalIndex])

  // Handle word click for selection
  const handleWordClick = useCallback((pos: WordPosition) => {
    if (!isSelecting) {
      // Start new selection
      setSelectionStart(pos)
      setSelectionEnd(null)
      setIsSelecting(true)
      setHoverPosition(pos)
    } else {
      // End selection
      setSelectionEnd(pos)
      setIsSelecting(false)

      // Create snippet from selection
      if (selectionStart) {
        const startIdx = getGlobalIndex(selectionStart)
        const endIdx = getGlobalIndex(pos)
        const minIdx = Math.min(startIdx, endIdx)
        const maxIdx = Math.max(startIdx, endIdx)

        const selectedWords = allWords.slice(minIdx, maxIdx + 1)
        if (selectedWords.length > 0) {
          const startTime = selectedWords[0].word.start
          const endTime = selectedWords[selectedWords.length - 1].word.end
          const text = selectedWords.map(w => w.word.text).join(' ')

          // Create temporary selection (not saved until user clicks "Save to Project")
          selectTemporarySnippet({ text, startTime, endTime })
        }
      }
    }
  }, [isSelecting, selectionStart, getGlobalIndex, allWords])

  // Handle word hover during selection
  const handleWordHover = useCallback((pos: WordPosition) => {
    if (isSelecting) {
      setHoverPosition(pos)
    }
  }, [isSelecting])

  // Cancel selection on escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isSelecting) {
      setIsSelecting(false)
      setSelectionStart(null)
      setSelectionEnd(null)
      setHoverPosition(null)
    }
  }, [isSelecting])

  const handleOpenProjectSettings = () => {
    console.log('Open project settings')
  }

  if (!selectedProject) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Select a project or create a new one</p>
      </div>
    )
  }

  // Show per-project loading state
  if (selectedProject.status === 'loading') {
    // Check if this is an interrupted transcription (not actively transcribing)
    const isInterrupted = !isTranscribing(selectedProject.id)

    if (isInterrupted) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
          <AlertCircle className="h-12 w-12 text-yellow-500" />
          <h2 className="text-xl font-semibold">Transcription Interrupted</h2>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            The transcription for "{selectedProject.name}" was interrupted. Click retry to continue.
          </p>
          <Button onClick={() => retryProject(selectedProject.id)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      )
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-background">
        <div className="flex flex-col items-center gap-4">
          <FileAudio className="h-12 w-12 animate-pulse text-primary" />
          <h2 className="text-xl font-semibold">Transcribing...</h2>
          <p className="text-sm text-muted-foreground">
            Processing {selectedProject.name}...
          </p>
        </div>
        <Progress value={70} className="w-64" />
      </div>
    )
  }

  // Show per-project error state
  if (selectedProject.status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {selectedProject.error || 'An unknown error occurred'}
        </p>
        <Button onClick={() => retryProject(selectedProject.id)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  // Show loading state when transcript is being loaded from IndexedDB
  if (isTranscriptLoading && transcript.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
        <FileAudio className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-sm text-muted-foreground">Loading transcript...</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="transcript" className="relative flex h-full flex-col bg-background">
      {/* Header - Sticky Top with Tabs */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{selectedProject.name}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenProjectSettings}
            title="Project Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <TabsList>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="snippets">Snippets</TabsTrigger>
          <TabsTrigger value="speakers">Speakers</TabsTrigger>
        </TabsList>
      </div>

      {/* Content Area - Scrollable */}
      <TabsContent value="transcript" className="mt-0 min-h-0 flex-1" onKeyDown={handleKeyDown} tabIndex={0}>
        {transcript.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="py-8 text-center text-muted-foreground">
              No transcript available
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="space-y-6">
                {transcript.map((segment, segmentIndex) => {
                  const displayName = selectedProject.speakerMap?.[segment.speaker] || segment.speaker
                  return (
                    <div key={segment.id} className="flex gap-4">
                      {/* Left margin - timestamp and speaker */}
                      <div className="flex-shrink-0 text-right">
                        <div className="sticky top-4 flex items-center gap-2">
                          <div
                            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            onClick={() => seek(segment.startTime)}
                          >
                            {formatTime(segment.startTime)}
                          </div>
                          <Badge variant="secondary">
                            {displayName}
                          </Badge>
                        </div>
                      </div>

                      {/* Center - flowing text with clickable words */}
                      <div className="flex-1 leading-relaxed">
                        {segment.words?.map((word, wordIndex) => {
                          const pos: WordPosition = { segmentIndex, wordIndex, word }
                          const isSelected = isWordInSelection(pos)
                          const isLastWord = wordIndex === (segment.words?.length ?? 0) - 1

                          return (
                            <span key={`${segment.id}-${wordIndex}`}>
                              <span
                                ref={(el) => {
                                  const key = `${segmentIndex}-${wordIndex}`
                                  if (el) {
                                    wordRefs.current.set(key, el)
                                  } else {
                                    wordRefs.current.delete(key)
                                  }
                                }}
                                onClick={() => handleWordClick(pos)}
                                onMouseEnter={() => handleWordHover(pos)}
                                className={`transition-colors ${
                                  isSelected
                                    ? 'bg-yellow-200 dark:bg-yellow-800'
                                    : 'hover:bg-muted'
                                }`}
                              >
                                {word.text}
                              </span>
                              {!isLastWord && ' '}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </TabsContent>

      <TabsContent value="snippets" className="mt-0 min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-4">
            {snippets.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No snippets saved yet. Click on words in the transcript to create snippets.
              </p>
            ) : (
              snippets.map((snippet) => (
                <Card
                  key={snippet.id}
                  className="cursor-pointer transition-colors hover:bg-accent"
                  onClick={() => selectSnippet(snippet)}
                >
                  <CardContent className="p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{snippet.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(snippet.startTime)} - {formatTime(snippet.endTime)}
                      </span>
                    </div>
                    {snippet.text && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {snippet.text}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="speakers" className="mt-0 min-h-0 flex-1">
        <SpeakersPanel />
      </TabsContent>

      <PlaybackControls
        currentTime={currentTime}
        duration={duration}
        isLoaded={isLoaded}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        onSeek={seek}
        onTogglePlayback={togglePlayback}
        onPlaybackRateChange={setPlaybackRate}
      />
    </Tabs>
  )
}
