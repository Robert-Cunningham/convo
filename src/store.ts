import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { produce } from 'immer'
import type { Project, TranscriptSegment, Snippet, SelectedItem } from './types'

interface AppState {
  // Persisted state
  projects: Project[]
  selectedProjectId: string | null

  // Non-persisted state
  isPlaying: boolean
  selectedItem: SelectedItem | null

  // Multi-select state (non-persisted)
  isMultiSelectMode: boolean
  selectedProjectIds: string[]

  // Single immer-based mutator
  mutate: (fn: (state: AppState) => void) => void

  // Simple actions that belong on state
  clearSelection: () => void
  togglePlayback: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Persisted state
      projects: [],
      selectedProjectId: null,

      // Non-persisted state
      isPlaying: false,
      selectedItem: null,

      // Multi-select state (non-persisted)
      isMultiSelectMode: false,
      selectedProjectIds: [],

      // Single mutator using immer's produce
      mutate: (fn) => set(produce(fn)),

      // Simple top-level actions
      clearSelection: () => set({ selectedItem: null }),
      togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),
    }),
    {
      name: 'convo-standalone-storage',
      partialize: (state) => ({
        projects: state.projects,
        selectedProjectId: state.selectedProjectId,
      }),
    }
  )
)

// Action helpers
export const addProject = (project: Project) =>
  useAppStore.getState().mutate((s) => {
    s.projects.push(project)
  })

export const selectProject = (id: string) =>
  useAppStore.getState().mutate((s) => {
    s.selectedProjectId = id
    s.selectedItem = null
    s.isPlaying = false
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
      text: snippet.text,
      startTime: snippet.startTime,
      endTime: snippet.endTime,
    }
  })

export const selectTemporarySnippet = (data: { text: string; startTime: number; endTime: number }) =>
  useAppStore.getState().mutate((s) => {
    s.selectedItem = {
      type: 'segment', // Use 'segment' type so "Save to Project" button appears
      id: crypto.randomUUID(),
      text: data.text,
      startTime: data.startTime,
      endTime: data.endTime,
    }
  })

export const addSnippet = (snippet: Snippet) =>
  useAppStore.getState().mutate((s) => {
    const project = s.projects.find((p) => p.id === s.selectedProjectId)
    if (project) {
      if (!project.snippets) {
        project.snippets = []
      }
      project.snippets.push(snippet)
    }
  })

export const updateSpeakerName = (projectId: string, speakerId: string, customName: string) =>
  useAppStore.getState().mutate((s) => {
    const project = s.projects.find((p) => p.id === projectId)
    if (project) {
      // Initialize speakerMap if it doesn't exist (for old projects)
      if (!project.speakerMap) {
        project.speakerMap = {}
      }
      if (customName.trim() === '') {
        delete project.speakerMap[speakerId]
      } else {
        project.speakerMap[speakerId] = customName.trim()
      }
    }
  })

// Custom hooks for derived state
export const useTranscript = () => {
  return useAppStore(
    useShallow((state) => {
      if (!state.selectedProjectId) return []
      const project = state.projects.find((p) => p.id === state.selectedProjectId)
      return project?.transcript ?? []
    })
  )
}

export const useSnippets = () => {
  return useAppStore(
    useShallow((state) => {
      if (!state.selectedProjectId) return []
      const project = state.projects.find((p) => p.id === state.selectedProjectId)
      return project?.snippets ?? []
    })
  )
}

// Multi-select action helpers
export const toggleMultiSelectMode = () =>
  useAppStore.getState().mutate((s) => {
    s.isMultiSelectMode = !s.isMultiSelectMode
    // Clear selections when exiting multi-select mode
    if (!s.isMultiSelectMode) {
      s.selectedProjectIds = []
    }
  })

export const exitMultiSelectMode = () =>
  useAppStore.getState().mutate((s) => {
    s.isMultiSelectMode = false
    s.selectedProjectIds = []
  })

export const toggleProjectSelection = (projectId: string) =>
  useAppStore.getState().mutate((s) => {
    const index = s.selectedProjectIds.indexOf(projectId)
    if (index >= 0) {
      s.selectedProjectIds.splice(index, 1)
    } else {
      s.selectedProjectIds.push(projectId)
    }
  })

export const getSelectedProjects = (): Project[] => {
  const state = useAppStore.getState()
  return state.projects.filter((p) => state.selectedProjectIds.includes(p.id))
}
