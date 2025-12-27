import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent } from './ui/dialog'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Loader2, Search } from 'lucide-react'
import { getAllTranscripts } from '@/lib/storage'
import { selectProject, setScrollToSegmentId, useAppStore } from '@/store'
import type { Project, TranscriptSegment } from '@/types'

interface SearchResult {
  projectId: string
  projectName: string
  segmentId: string
  speaker: string
  text: string
  matchStart: number
  matchEnd: number
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [transcripts, setTranscripts] = useState<Map<string, TranscriptSegment[]>>(new Map())
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  const projects = useAppStore((s) => s.projects)
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>()
    projects.forEach((p) => map.set(p.id, p))
    return map
  }, [projects])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 150)
    return () => clearTimeout(timer)
  }, [query])

  // Load all transcripts when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true)
      setQuery('')
      setDebouncedQuery('')
      setSelectedIndex(0)

      getAllTranscripts()
        .then(setTranscripts)
        .finally(() => setIsLoading(false))

      // Focus input after brief delay for animation
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Search algorithm
  const results = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) return []

    const searchTerm = debouncedQuery.toLowerCase()
    const matches: SearchResult[] = []

    transcripts.forEach((segments, projectId) => {
      const project = projectMap.get(projectId)
      if (!project || project.status !== 'ready') return

      for (const segment of segments) {
        const textLower = segment.text.toLowerCase()
        let searchPos = 0

        // Find all matches within this segment
        while (matches.length < 100) {
          const matchIndex = textLower.indexOf(searchTerm, searchPos)
          if (matchIndex === -1) break

          matches.push({
            projectId,
            projectName: project.name,
            segmentId: segment.id,
            speaker: project.speakerMap?.[segment.speaker] || segment.speaker,
            text: segment.text,
            matchStart: matchIndex,
            matchEnd: matchIndex + debouncedQuery.length,
          })

          searchPos = matchIndex + 1
        }

        if (matches.length >= 100) break
      }
    })

    return matches.slice(0, 100)
  }, [debouncedQuery, transcripts, projectMap])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Scroll selected item into view
  useEffect(() => {
    if (results.length > 0 && resultsContainerRef.current) {
      const selectedElement = resultsContainerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, results.length])

  // Navigate to result
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      setScrollToSegmentId(result.segmentId)
      selectProject(result.projectId)
      onOpenChange(false)
    },
    [onOpenChange]
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex])
          }
          break
      }
    },
    [results, selectedIndex, handleResultClick]
  )

  // Generate context snippet with highlighted match
  const getContextSnippet = (result: SearchResult) => {
    const { text, matchStart, matchEnd } = result
    const contextSize = 40

    const snippetStart = Math.max(0, matchStart - contextSize)
    const snippetEnd = Math.min(text.length, matchEnd + contextSize)

    const before = (snippetStart > 0 ? '...' : '') + text.slice(snippetStart, matchStart)
    const match = text.slice(matchStart, matchEnd)
    const after = text.slice(matchEnd, snippetEnd) + (snippetEnd < text.length ? '...' : '')

    return { before, match, after }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0" showCloseButton={false}>
        <div className="flex items-center gap-2 border-b px-3" onKeyDown={handleKeyDown}>
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all transcripts..."
            className="h-12 border-0 shadow-none focus-visible:ring-0"
          />
          {isLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
        </div>

        <ScrollArea className="max-h-[400px]">
          <div ref={resultsContainerRef}>
            {debouncedQuery.length >= 2 && results.length === 0 && !isLoading && (
              <div className="p-4 text-center text-muted-foreground">No results found</div>
            )}

            {results.map((result, index) => {
              const snippet = getContextSnippet(result)
              return (
                <div
                  key={`${result.segmentId}-${result.matchStart}`}
                  data-index={index}
                  className={`cursor-pointer px-4 py-3 ${
                    index === selectedIndex ? 'bg-accent' : 'hover:bg-muted'
                  }`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{result.projectName}</span>
                    <span className="text-xs text-muted-foreground">{result.speaker}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {snippet.before}
                    <span className="bg-yellow-200 font-medium text-foreground dark:bg-yellow-800">
                      {snippet.match}
                    </span>
                    {snippet.after}
                  </p>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {results.length > 0 && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            {results.length} result{results.length !== 1 ? 's' : ''} found
            <span className="ml-2">
              <kbd className="rounded bg-muted px-1">Enter</kbd> to select,{' '}
              <kbd className="rounded bg-muted px-1">Esc</kbd> to close
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
