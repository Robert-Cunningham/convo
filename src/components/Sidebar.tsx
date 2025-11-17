import { useState } from 'react'
import { useAppStore, selectProject, createProjectFromFile, deleteProject } from '@/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Settings, MessageSquareText, MoreHorizontal, Trash2 } from 'lucide-react'
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
      {/* Logo/Header */}
      <div className="flex items-center gap-2 p-4">
        <MessageSquareText className="h-5 w-5 text-primary" />
        <h1 className="text-base font-semibold">convo cruncher</h1>
        <span className="text-xs text-muted-foreground/60">v1</span>
      </div>

      <Separator />

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
                <div key={project.id} className="group flex items-center gap-1">
                  <Button
                    variant={selectedProjectId === project.id ? 'secondary' : 'ghost'}
                    className={cn(
                      'flex-1 justify-start truncate',
                      selectedProjectId === project.id && 'bg-accent'
                    )}
                    onClick={() => selectProject(project.id)}
                  >
                    {project.name}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => deleteProject(project.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
