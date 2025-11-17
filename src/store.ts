import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { produce } from 'immer'
import type { Project, TranscriptSegment, Snippet, SelectedItem, UploadStatus } from './types'
import { saveAudioFile, loadApiKey, deleteAudioFile } from './lib/storage'
import { transcribeAudio } from './lib/elevenlabs'

interface AppState {
  // Persisted state
  projects: Project[]
  selectedProjectId: string | null

  // Non-persisted state
  isPlaying: boolean
  selectedItem: SelectedItem | null
  uploadStatus: UploadStatus
  uploadError: string | null

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
      uploadStatus: 'idle',
      uploadError: null,

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

export const setUploadStatus = (status: UploadStatus, error?: string) =>
  useAppStore.getState().mutate((s) => {
    s.uploadStatus = status
    s.uploadError = error ?? null
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

export const deleteProject = async (projectId: string) => {
  const store = useAppStore.getState()
  const project = store.projects.find((p) => p.id === projectId)

  if (!project) return

  // Delete audio file from IndexedDB
  try {
    await deleteAudioFile(project.audioFileId)
  } catch (error) {
    console.error('Failed to delete audio file:', error)
  }

  // Remove project from store
  store.mutate((s) => {
    s.projects = s.projects.filter((p) => p.id !== projectId)

    // If the deleted project was selected, clear selection
    if (s.selectedProjectId === projectId) {
      s.selectedProjectId = s.projects.length > 0 ? s.projects[0].id : null
      s.selectedItem = null
      s.isPlaying = false
    }
  })
}

export const createProjectFromFile = async (file: File) => {
  const store = useAppStore.getState()

  // Check for API key
  const apiKey = loadApiKey()
  if (!apiKey) {
    setUploadStatus('error', 'Please set your ElevenLabs API key in Settings')
    return
  }

  try {
    // Set uploading status
    setUploadStatus('uploading')

    // Generate IDs
    const projectId = crypto.randomUUID()
    const audioFileId = crypto.randomUUID()

    // Save audio file to IndexedDB
    await saveAudioFile(audioFileId, file)

    // Set transcribing status
    setUploadStatus('transcribing')

    // Transcribe the audio
    const transcript = await transcribeAudio(file, apiKey)

    // Create the project
    const project: Project = {
      id: projectId,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      audioFileName: file.name,
      audioFileId,
      transcript,
      snippets: [],
      speakerMap: {},
      createdAt: Date.now(),
    }

    // Add project to store (automatically persisted via zustand persist middleware)
    store.mutate((s) => {
      s.projects.push(project)
      s.selectedProjectId = projectId
      s.selectedItem = null
      s.isPlaying = false
      s.uploadStatus = 'complete'
      s.uploadError = null
    })

    // Reset status after a short delay
    setTimeout(() => {
      setUploadStatus('idle')
    }, 2000)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    setUploadStatus('error', errorMessage)
  }
}

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
