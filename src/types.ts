export interface Project {
  id: string
  name: string
  audioFileName: string
  audioFileId: string // IndexedDB key
  transcript: TranscriptSegment[]
  snippets: Snippet[]
  speakerMap: Record<string, string> // Maps speaker IDs to custom names
  createdAt: number
  status?: 'loading' | 'ready' | 'error' // Optional for backwards compat with existing projects
  error?: string // Error message if status is 'error'
}

export type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'complete' | 'error'

export interface TranscriptWord {
  text: string
  start: number
  end: number
  speaker: string
}

export interface TranscriptSegment {
  id: string
  speaker: string
  text: string
  words: TranscriptWord[]
  startTime: number
  endTime: number
}

export interface Snippet {
  id: string
  name: string
  text: string
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
