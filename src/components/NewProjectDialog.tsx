import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Upload } from 'lucide-react'

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilesSelected: (files: File[]) => void
}

export function NewProjectDialog({
  open,
  onOpenChange,
  onFilesSelected,
}: NewProjectDialogProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        const validFiles = Array.from(files).filter(
          (file) => file.type.startsWith('audio/') || file.type.startsWith('video/')
        )
        if (validFiles.length > 0) {
          onFilesSelected(validFiles)
          onOpenChange(false)
        }
      }
    },
    [onFilesSelected, onOpenChange]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        onFilesSelected(Array.from(files))
        onOpenChange(false)
      }
    },
    [onFilesSelected, onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            mt-4 border-2 border-dashed rounded-lg p-12
            flex flex-col items-center justify-center gap-4
            transition-colors cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          `}
        >
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              Drop your audio or video files here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse (select multiple)
            </p>
          </div>
          <input
            type="file"
            accept="audio/*,video/*"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
