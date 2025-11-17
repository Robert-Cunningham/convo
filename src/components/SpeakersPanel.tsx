import { useAppStore, updateSpeakerName } from '@/store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMemo } from 'react'

export function SpeakersPanel() {
  const projects = useAppStore((state) => state.projects)
  const selectedProjectId = useAppStore((state) => state.selectedProjectId)
  const transcript = useAppStore((state) => state.transcript)

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  // Get unique speakers from transcript
  const speakers = useMemo(() => {
    const speakerSet = new Set<string>()
    transcript.forEach((segment) => speakerSet.add(segment.speaker))
    return Array.from(speakerSet).sort()
  }, [transcript])

  if (!selectedProject) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    )
  }

  if (speakers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No speakers found in transcript</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          Map speaker IDs to custom names. These will be displayed throughout the transcript.
        </p>
        {speakers.map((speaker) => (
          <div key={speaker} className="space-y-2">
            <Label htmlFor={`speaker-${speaker}`} className="text-sm font-medium">
              {speaker}
            </Label>
            <Input
              id={`speaker-${speaker}`}
              placeholder={`Enter name for ${speaker}`}
              value={selectedProject.speakerMap?.[speaker] || ''}
              onChange={(e) =>
                updateSpeakerName(selectedProject.id, speaker, e.target.value)
              }
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
