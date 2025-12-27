import { useState } from 'react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Label } from './ui/label'
import {
  downloadMarkdown,
  exportProjectsAsZip,
  exportProjectsToText,
  exportProjectToMarkdown,
  type ExportOptions,
} from '@/lib/export'
import type { Project } from '@/types'
import { Copy, Download } from 'lucide-react'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  onExportComplete?: () => void
}

export function ExportDialog({
  open,
  onOpenChange,
  projects,
  onExportComplete,
}: ExportDialogProps) {
  const [includeTimestamps, setIncludeTimestamps] = useState(true)

  const options: ExportOptions = { includeTimestamps }

  const handleCopy = async () => {
    if (projects.length === 0) return

    const text = await exportProjectsToText(projects, options)
    await navigator.clipboard.writeText(text)

    onOpenChange(false)
    onExportComplete?.()
  }

  const handleDownload = async () => {
    if (projects.length === 0) return

    if (projects.length === 1) {
      const project = projects[0]
      const markdown = await exportProjectToMarkdown(project, options)
      downloadMarkdown(markdown, project.name)
    } else {
      await exportProjectsAsZip(projects, options)
    }

    onOpenChange(false)
    onExportComplete?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-timestamps"
              checked={includeTimestamps}
              onCheckedChange={(checked) => setIncludeTimestamps(checked === true)}
            />
            <Label htmlFor="include-timestamps">Include timestamps</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
