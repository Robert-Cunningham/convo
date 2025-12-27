import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { createProjectsFromFiles, deleteProject } from '@/project'
import {
  exitMultiSelectMode,
  getSelectedProjects,
  selectProject,
  selectProjectsById,
  toggleMultiSelectMode,
  toggleProjectSelection,
  useAppStore,
} from '@/store'
import type { Project } from '@/types'
import { AlertCircle, ArrowDownAZ, ArrowUpAZ, CalendarArrowDown, CalendarArrowUp, Download, Filter, Loader2, MessageSquareText, MoreHorizontal, Plus, Settings, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { ExportDialog } from './ExportDialog'
import { NewProjectDialog } from './NewProjectDialog'
import { SettingsDialog } from './SettingsDialog'

type SortOption = 'name-asc' | 'name-desc' | 'date-new' | 'date-old'

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
  const [searchQuery, setSearchQuery] = useLocalStorage('convo-sidebar-search', '')
  const [sortOption, setSortOption] = useLocalStorage<SortOption>('convo-sidebar-sort', 'date-new')
  const [filterOpen, setFilterOpen] = useState(false)

  const selectedCount = selectedProjectIds.length
  const hasActiveFilter = searchQuery !== '' || sortOption !== 'date-new'

  const filteredProjects = useMemo(() => {
    let result = projects.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'date-new':
          return b.createdAt - a.createdAt
        case 'date-old':
          return a.createdAt - b.createdAt
      }
    })

    return result
  }, [projects, searchQuery, sortOption])

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
        // Use filtered array indices for range selection
        const fromIndex = filteredProjects.findIndex((p) => p.id === lastSelectedProjectId)
        const toIndex = filteredProjects.findIndex((p) => p.id === projectId)
        if (fromIndex !== -1 && toIndex !== -1) {
          const start = Math.min(fromIndex, toIndex)
          const end = Math.max(fromIndex, toIndex)
          const idsToSelect = filteredProjects.slice(start, end + 1).map((p) => p.id)
          selectProjectsById(idsToSelect, projectId)
        } else {
          toggleProjectSelection(projectId)
        }
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
              <div className="flex items-center gap-1">
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-6 w-6">
                      <Filter className="h-3.5 w-3.5" />
                      {hasActiveFilter && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end">
                    <div className="space-y-3">
                      <Input
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8"
                      />
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Sort by</p>
                        <div className="grid grid-cols-2 gap-1">
                          <Button
                            variant={sortOption === 'name-asc' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 justify-start text-xs"
                            onClick={() => setSortOption('name-asc')}
                          >
                            <ArrowDownAZ className="mr-1.5 h-3.5 w-3.5" />
                            A-Z
                          </Button>
                          <Button
                            variant={sortOption === 'name-desc' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 justify-start text-xs"
                            onClick={() => setSortOption('name-desc')}
                          >
                            <ArrowUpAZ className="mr-1.5 h-3.5 w-3.5" />
                            Z-A
                          </Button>
                          <Button
                            variant={sortOption === 'date-new' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 justify-start text-xs"
                            onClick={() => setSortOption('date-new')}
                          >
                            <CalendarArrowDown className="mr-1.5 h-3.5 w-3.5" />
                            Newest
                          </Button>
                          <Button
                            variant={sortOption === 'date-old' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 justify-start text-xs"
                            onClick={() => setSortOption('date-old')}
                          >
                            <CalendarArrowUp className="mr-1.5 h-3.5 w-3.5" />
                            Oldest
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={toggleMultiSelectMode}
                >
                  {isMultiSelectMode ? 'Cancel' : 'Select'}
                </Button>
              </div>
            )}
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet</p>
          ) : filteredProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching projects</p>
          ) : (
            <div className="space-y-1">
              {filteredProjects.map((project) => (
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
