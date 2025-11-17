import { create } from 'zustand'
import { produce } from 'immer'
import type { Project, TranscriptSegment, Snippet, SelectedItem } from './types'

interface AppState {
  // State
  projects: Project[]
  selectedProjectId: string | null
  transcript: TranscriptSegment[]
  snippets: Snippet[]
  isPlaying: boolean
  selectedItem: SelectedItem | null

  // Single immer-based mutator
  mutate: (fn: (state: AppState) => void) => void

  // Simple actions that belong on state
  clearSelection: () => void
  togglePlayback: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  projects: [],
  selectedProjectId: null,
  transcript: [],
  snippets: [],
  isPlaying: false,
  selectedItem: null,

  // Single mutator using immer's produce
  mutate: (fn) => set(produce(fn)),

  // Simple top-level actions
  clearSelection: () => set({ selectedItem: null }),
  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),
}))

// Action helpers
export const addProject = (project: Project) =>
  useAppStore.getState().mutate((s) => {
    s.projects.push(project)
  })

export const selectProject = (id: string) =>
  useAppStore.getState().mutate((s) => {
    s.selectedProjectId = id
    s.selectedItem = null
    s.transcript = []
    s.snippets = []
    s.isPlaying = false
  })

export const setTranscript = (transcript: TranscriptSegment[]) =>
  useAppStore.getState().mutate((s) => {
    s.transcript = transcript
  })

export const setSnippets = (snippets: Snippet[]) =>
  useAppStore.getState().mutate((s) => {
    s.snippets = snippets
  })

export const setIsPlaying = (isPlaying: boolean) =>
  useAppStore.getState().mutate((s) => {
    s.isPlaying = isPlaying
  })

export const selectSegment = (segment: TranscriptSegment) =>
  useAppStore.getState().mutate((s) => {
    s.selectedItem = {
      type: 'segment',
      id: segment.id,
      speaker: segment.speaker,
      text: segment.text,
      startTime: segment.startTime,
      endTime: segment.endTime,
    }
  })

export const selectSnippet = (snippet: Snippet) =>
  useAppStore.getState().mutate((s) => {
    s.selectedItem = {
      type: 'snippet',
      id: snippet.id,
      name: snippet.name,
      startTime: snippet.startTime,
      endTime: snippet.endTime,
    }
  })

export const addSnippet = (snippet: Snippet) =>
  useAppStore.getState().mutate((s) => {
    s.snippets.push(snippet)
  })
