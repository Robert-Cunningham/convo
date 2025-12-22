import { useState } from 'react'
import {
  useAppStore,
  selectProject,
  createProjectFromFile,
  deleteProject,
  toggleMultiSelectMode,
  toggleProjectSelection,
  exitMultiSelectMode,
  getSelectedProjects,
} from '@/store'
import { exportProjectsAsZip, exportProjectToMarkdown, downloadMarkdown } from '@/lib/export'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Settings, MessageSquareText, MoreHorizontal, Trash2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NewProjectDialog } from './NewProjectDialog'
import { SettingsDialog } from './SettingsDialog'

export function Sidebar() {
  const projects = useAppStore((state) => state.projects)
  const selectedProjectId = useAppStore((state) => state.selectedProjectId)
  const isMultiSelectMode = useAppStore((state) => state.isMultiSelectMode)
  const selectedProjectIds = useAppStore((state) => state.selectedProjectIds)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const selectedCount = selectedProjectIds.length

  const handleNewProject = () => {
    setNewProjectOpen(true)
  }

  const handleOpenSettings = () => {
    setSettingsOpen(true)
  }

  const handleFileSelected = (file: File) => {
    createProjectFromFile(file)
  }

  const handleExportSelected = async () => {
    const selectedProjects = getSelectedProjects()
    if (selectedProjects.length === 0) return

    if (selectedProjects.length === 1) {
      // Single project: download as .md file
      const project = selectedProjects[0]
      const markdown = exportProjectToMarkdown(project)
      downloadMarkdown(markdown, project.name)
    } else {
      // Multiple projects: download as ZIP
      await exportProjectsAsZip(selectedProjects)
    }

    // Exit multi-select mode after export
    exitMultiSelectMode()
  }

  const handleProjectClick = (projectId: string) => {
    if (isMultiSelectMode) {
      toggleProjectSelection(projectId)
    } else {
      selectProject(projectId)
    }
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
                <div key={project.id} className="group flex items-center gap-1">
                  {isMultiSelectMode && (
                    <Checkbox
                      checked={selectedProjectIds.includes(project.id)}
                      onCheckedChange={() => toggleProjectSelection(project.id)}
                      className="mr-1"
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
                      'flex-1 justify-start truncate',
                      !isMultiSelectMode && selectedProjectId === project.id && 'bg-accent'
                    )}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    {project.name}
                  </Button>
                  {!isMultiSelectMode && (
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
            <Button size="sm" disabled={selectedCount === 0} onClick={handleExportSelected}>
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
