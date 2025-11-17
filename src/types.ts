export interface Project {
  id: string
  name: string
}

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
