import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { createProjectsFromFiles, deleteProject } from '@/project'
import {
  exitMultiSelectMode,
  getSelectedProjects,
  selectProject,
  selectProjectRange,
  toggleMultiSelectMode,
  toggleProjectSelection,
  useAppStore,
} from '@/store'
import type { Project } from '@/types'
import { AlertCircle, Download, Loader2, MessageSquareText, MoreHorizontal, Plus, Settings, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ExportDialog } from './ExportDialog'
import { NewProjectDialog } from './NewProjectDialog'
import { SettingsDialog } from './SettingsDialog'

export function Sidebar() {
  const projects = useAppStore((state) => state.projects)
  const selectedProjectId = useAppStore((state) => state.selectedProjectId)
  const isMultiSelectMode = useAppStore((state) => state.isMultiSelectMode)
  const selectedProjectIds = useAppStore((state) => state.selectedProjectIds)
  const lastSelectedProjectId = useAppStore((state) => state.lastSelectedProjectId)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [projectsToExport, setProjectsToExport] = useState<Project[]>([])

  const selectedCount = selectedProjectIds.length

  const handleNewProject = () => {
    setNewProjectOpen(true)
  }

  const handleOpenSettings = () => {
    setSettingsOpen(true)
  }

  const handleFilesSelected = (files: File[]) => {
    createProjectsFromFiles(files)
  }

  const handleOpenExportDialog = () => {
    const selected = getSelectedProjects()
    if (selected.length > 0) {
      setProjectsToExport(selected)
      setExportDialogOpen(true)
    }
  }

  const handleProjectClick = (projectId: string, event: React.MouseEvent) => {
    if (isMultiSelectMode) {
      if (event.shiftKey && lastSelectedProjectId) {
        selectProjectRange(lastSelectedProjectId, projectId)
      } else {
        toggleProjectSelection(projectId)
      }
    } else {
      selectProject(projectId)
    }
  }

  return (
    <>
      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        onFilesSelected={handleFilesSelected}
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        projects={projectsToExport}
        onExportComplete={exitMultiSelectMode}
      />
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

      <ScrollArea className="flex-1 w-full">
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Projects
            </h3>
            {projects.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={toggleMultiSelectMode}
              >
                {isMultiSelectMode ? 'Cancel' : 'Select'}
              </Button>
            )}
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet</p>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <div key={project.id} className="group flex items-center gap-1 overflow-hidden">
                  {isMultiSelectMode && (
                    <Checkbox
                      checked={selectedProjectIds.includes(project.id)}
                      onCheckedChange={() => toggleProjectSelection(project.id)}
                      className="mr-1 flex-shrink-0"
                    />
                  )}
                  <Button
                    variant={
                      isMultiSelectMode
                        ? selectedProjectIds.includes(project.id)
                          ? 'secondary'
                          : 'ghost'
                        : selectedProjectId === project.id
                          ? 'secondary'
                          : 'ghost'
                    }
                    className={cn(
                      'min-w-0 shrink flex-1 justify-start truncate',
                      !isMultiSelectMode && selectedProjectId === project.id && 'bg-accent'
                    )}
                    onClick={(e) => handleProjectClick(project.id, e)}
                  >
                    {project.status === 'loading' && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                    )}
                    {project.status === 'error' && (
                      <AlertCircle className="mr-2 h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <span className="truncate max-w-[15dvh]">{project.name}</span>
                  </Button>
                  {!isMultiSelectMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100"
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
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {isMultiSelectMode && (
        <>
          <Separator />
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
            <Button size="sm" disabled={selectedCount === 0} onClick={handleOpenExportDialog}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </>
      )}

      <Separator />

      <div className="p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={handleOpenSettings}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
    </>
  )
}
