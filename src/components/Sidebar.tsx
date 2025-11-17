import { useState } from 'react'
import { useAppStore, selectProject, createProjectFromFile } from '@/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NewProjectDialog } from './NewProjectDialog'
import { SettingsDialog } from './SettingsDialog'

export function Sidebar() {
  const projects = useAppStore((state) => state.projects)
  const selectedProjectId = useAppStore((state) => state.selectedProjectId)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleNewProject = () => {
    setNewProjectOpen(true)
  }

  const handleOpenSettings = () => {
    setSettingsOpen(true)
  }

  const handleFileSelected = (file: File) => {
    createProjectFromFile(file)
  }

  return (
    <>
      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        onFileSelected={handleFileSelected}
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    <div className="flex h-full flex-col border-r bg-muted/40">
      <div className="p-4">
        <Button onClick={handleNewProject} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Projects
          </h3>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet</p>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant={selectedProjectId === project.id ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    selectedProjectId === project.id && 'bg-accent'
                  )}
                  onClick={() => selectProject(project.id)}
                >
                  {project.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleOpenSettings}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
    </>
  )
}
