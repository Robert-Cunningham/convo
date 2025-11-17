import { useEffect } from 'react'
import { useAppStore, addSnippet, selectSnippet, useSnippets } from '@/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Save, Loader2 } from 'lucide-react'
import { useSnippetAudio } from '@/hooks/useSnippetAudio'

export function InspectorPanel() {
  const selectedItem = useAppStore((state) => state.selectedItem)
  const selectedProjectId = useAppStore((state) => state.selectedProjectId)
  const projects = useAppStore((state) => state.projects)
  const snippets = useSnippets()

  const project = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : undefined

  const { audioUrl, isGenerating, error, generate, reset } = useSnippetAudio({
    audioFileId: project?.audioFileId,
    startTime: selectedItem?.startTime ?? 0,
    endTime: selectedItem?.endTime ?? 0,
  })

  // Auto-generate audio when selection changes
  useEffect(() => {
    reset()
    if (selectedItem) {
      generate()
    }
  }, [selectedItem?.id, reset, generate])

  const handleSaveSnippet = () => {
    if (!selectedItem) return

    const snippet = {
      id: crypto.randomUUID(),
      name: `Snippet ${snippets.length + 1}`,
      text: selectedItem.text ?? '',
      startTime: selectedItem.startTime,
      endTime: selectedItem.endTime,
    }

    addSnippet(snippet)
    selectSnippet(snippet)
  }

  if (!selectedItem) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="px-4 text-center text-sm text-muted-foreground">
          Select a segment from the transcript to inspect
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Inspector</h3>
      </div>

      <Separator />

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Type Badge */}
          <div>
            <Badge variant={selectedItem.type === 'segment' ? 'default' : 'secondary'}>
              {selectedItem.type === 'segment' ? 'Transcript Segment' : 'Saved Snippet'}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {selectedItem.speaker && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Speaker
                </label>
                <p className="text-sm">{selectedItem.speaker}</p>
              </div>
            )}

            {selectedItem.name && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Name
                </label>
                <p className="text-sm">{selectedItem.name}</p>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Time Range
              </label>
              <p className="text-sm">
                {formatTime(selectedItem.startTime)} - {formatTime(selectedItem.endTime)}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Duration
              </label>
              <p className="text-sm">
                {formatDuration(selectedItem.endTime - selectedItem.startTime)}
              </p>
            </div>

            {selectedItem.text && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Text
                </label>
                <p className="rounded bg-muted p-2 text-sm">{selectedItem.text}</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <Separator />

      {/* Actions */}
      <div className="space-y-2 p-4">
        {isGenerating && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating audio...
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {audioUrl && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Audio Preview (right-click to download)
            </label>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        {selectedItem.type === 'segment' && (
          <Button variant="secondary" className="w-full" onClick={handleSaveSnippet}>
            <Save className="mr-2 h-4 w-4" />
            Save to Project
          </Button>
        )}
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`
  }
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs}s`
}
