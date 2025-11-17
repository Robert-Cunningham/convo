import { useAppStore, selectSegment, selectSnippet } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Settings, Play, Pause } from 'lucide-react'

export function MainPanel() {
  const projects = useAppStore((state) => state.projects)
  const selectedProjectId = useAppStore((state) => state.selectedProjectId)
  const transcript = useAppStore((state) => state.transcript)
  const snippets = useAppStore((state) => state.snippets)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const togglePlayback = useAppStore((state) => state.togglePlayback)

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  const handleOpenProjectSettings = () => {
    // TODO: Implement project settings (speaker mapping)
    console.log('Open project settings')
  }

  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <p className="text-muted-foreground">Select a project or create a new one</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
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
      </div>

      {/* Content Area */}
      <Tabs defaultValue="transcript" className="flex flex-1 flex-col">
        <div className="border-b px-4">
          <TabsList>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="snippets">Snippets</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="transcript" className="mt-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              {transcript.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No transcript available
                </p>
              ) : (
                transcript.map((segment) => (
                  <Card
                    key={segment.id}
                    className="cursor-pointer transition-colors hover:bg-accent"
                    onClick={() => selectSegment(segment)}
                  >
                    <CardContent className="p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="secondary">{segment.speaker}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                        </span>
                      </div>
                      <p className="text-sm">{segment.text}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="snippets" className="mt-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              {snippets.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No snippets saved yet
                </p>
              ) : (
                snippets.map((snippet) => (
                  <Card
                    key={snippet.id}
                    className="cursor-pointer transition-colors hover:bg-accent"
                    onClick={() => selectSnippet(snippet)}
                  >
                    <CardContent className="flex items-center justify-between p-3">
                      <span className="text-sm font-medium">{snippet.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(snippet.startTime)} - {formatTime(snippet.endTime)}
                      </span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Playback Controls */}
      <div className="flex justify-center border-t p-4">
        <Button
          size="lg"
          className="rounded-full"
          onClick={togglePlayback}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
