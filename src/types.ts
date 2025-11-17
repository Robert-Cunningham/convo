export interface Project {
  id: string
  name: string
  audioFileName: string
  audioFileId: string // IndexedDB key
  transcript: TranscriptSegment[]
  createdAt: number
}

export type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'complete' | 'error'

export interface TranscriptSegment {
  id: string
  speaker: string
  text: string
  startTime: number
  endTime: number
}

export interface Snippet {
  id: string
  name: string
  startTime: number
  endTime: number
}

export interface SelectedItem {
  type: 'segment' | 'snippet'
  id: string
  speaker?: string
  text?: string
  name?: string
  startTime: number
  endTime: number
}

export type ViewMode = 'transcript' | 'snippets'
