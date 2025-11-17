import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Download, Save } from 'lucide-react'

export function InspectorPanel() {
  const selectedItem = useAppStore((state) => state.selectedItem)

  const handleDownload = () => {
    // TODO: Implement snippet download
    console.log('Download snippet')
  }

  const handleSaveSnippet = () => {
    // TODO: Implement save snippet to project
    console.log('Save snippet to project')
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
        <Button className="w-full" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download Snippet
        </Button>

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
