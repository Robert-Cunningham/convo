import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { produce } from 'immer'
import type { Project, TranscriptSegment, Snippet, SelectedItem } from './types'
import { getTranscript } from './lib/storage'

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

  // Transcript cache (non-persisted, loaded on-demand from IndexedDB)
  transcriptCache: Map<string, TranscriptSegment[]>
  loadingTranscripts: Set<string>

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

      // Transcript cache (non-persisted)
      transcriptCache: new Map(),
      loadingTranscripts: new Set(),

      // Single mutator using immer's produce
      mutate: (fn) => set(produce(fn)),

      // Simple top-level actions
      clearSelection: () => set({ selectedItem: null }),
      togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),
    }),
    {
      name: 'convo-standalone-storage',
      partialize: (state) => ({
        // Strip transcript arrays from projects to avoid localStorage quota issues
        projects: state.projects.map((p) => {
          const { transcript, ...rest } = p
          return rest
        }),
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

// Load transcript from IndexedDB into cache
export const loadTranscriptForProject = async (projectId: string) => {
  const state = useAppStore.getState()
  const project = state.projects.find((p) => p.id === projectId)

  if (!project?.transcriptId) return
  if (state.transcriptCache.has(projectId)) return
  if (state.loadingTranscripts.has(projectId)) return

  // Mark as loading
  useAppStore.setState((s) => ({
    loadingTranscripts: new Set(s.loadingTranscripts).add(projectId),
  }))

  try {
    const segments = await getTranscript(project.transcriptId)
    useAppStore.setState((s) => {
      const newCache = new Map(s.transcriptCache)
      const newLoading = new Set(s.loadingTranscripts)
      if (segments) {
        newCache.set(projectId, segments)
      }
      newLoading.delete(projectId)
      return { transcriptCache: newCache, loadingTranscripts: newLoading }
    })
  } catch (error) {
    console.error('Failed to load transcript:', error)
    useAppStore.setState((s) => {
      const newLoading = new Set(s.loadingTranscripts)
      newLoading.delete(projectId)
      return { loadingTranscripts: newLoading }
    })
  }
}

// Cache a transcript (used after transcription completes)
export const cacheTranscript = (projectId: string, segments: TranscriptSegment[]) => {
  useAppStore.setState((s) => {
    const newCache = new Map(s.transcriptCache)
    newCache.set(projectId, segments)
    return { transcriptCache: newCache }
  })
}

// Clear transcript cache for a project (used on delete)
export const clearTranscriptCache = (projectId: string) => {
  useAppStore.setState((s) => {
    const newCache = new Map(s.transcriptCache)
    const newLoading = new Set(s.loadingTranscripts)
    newCache.delete(projectId)
    newLoading.delete(projectId)
    return { transcriptCache: newCache, loadingTranscripts: newLoading }
  })
}

// Custom hooks for derived state
export const useTranscript = () => {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)
  const project = useAppStore((s) =>
    s.selectedProjectId ? s.projects.find((p) => p.id === s.selectedProjectId) : null
  )
  const cachedTranscript = useAppStore((s) =>
    selectedProjectId ? s.transcriptCache.get(selectedProjectId) : undefined
  )
  const isLoading = useAppStore((s) =>
    selectedProjectId ? s.loadingTranscripts.has(selectedProjectId) : false
  )

  // Trigger load from IndexedDB if needed
  if (selectedProjectId && project?.transcriptId && !cachedTranscript && !isLoading) {
    loadTranscriptForProject(selectedProjectId)
  }

  // Return cached transcript, legacy inline transcript, or empty array
  return cachedTranscript ?? project?.transcript ?? []
}

// Hook to check if transcript is loading
export const useTranscriptLoading = () => {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)
  return useAppStore((s) =>
    selectedProjectId ? s.loadingTranscripts.has(selectedProjectId) : false
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
