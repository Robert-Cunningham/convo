import { create } from 'zustand'
import type { Project, TranscriptSegment, Snippet, SelectedItem } from './types'

interface AppState {
  // Projects
  projects: Project[]
  selectedProjectId: string | null

  // Current project data
  transcript: TranscriptSegment[]
  snippets: Snippet[]

  // Playback
  isPlaying: boolean

  // Inspector
  selectedItem: SelectedItem | null

  // Actions
  addProject: (project: Project) => void
  selectProject: (id: string) => void
  setTranscript: (transcript: TranscriptSegment[]) => void
  setSnippets: (snippets: Snippet[]) => void
  togglePlayback: () => void
  setIsPlaying: (isPlaying: boolean) => void
  selectSegment: (segment: TranscriptSegment) => void
  selectSnippet: (snippet: Snippet) => void
  clearSelection: () => void
  addSnippet: (snippet: Snippet) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  projects: [],
  selectedProjectId: null,
  transcript: [],
  snippets: [],
  isPlaying: false,
  selectedItem: null,

  // Actions
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),

  selectProject: (id) =>
    set({
      selectedProjectId: id,
      selectedItem: null,
      // Reset project-specific data when switching projects
      transcript: [],
      snippets: [],
      isPlaying: false,
    }),

  setTranscript: (transcript) => set({ transcript }),

  setSnippets: (snippets) => set({ snippets }),

  togglePlayback: () =>
    set((state) => ({
      isPlaying: !state.isPlaying,
    })),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  selectSegment: (segment) =>
    set({
      selectedItem: {
        type: 'segment',
        id: segment.id,
        speaker: segment.speaker,
        text: segment.text,
        startTime: segment.startTime,
        endTime: segment.endTime,
      },
    }),

  selectSnippet: (snippet) =>
    set({
      selectedItem: {
        type: 'snippet',
        id: snippet.id,
        name: snippet.name,
        startTime: snippet.startTime,
        endTime: snippet.endTime,
      },
    }),

  clearSelection: () => set({ selectedItem: null }),

  addSnippet: (snippet) =>
    set((state) => ({
      snippets: [...state.snippets, snippet],
    })),
}))
