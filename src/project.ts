import type { Project } from './types'
import { useAppStore, cacheTranscript, clearTranscriptCache, startTranscription, endTranscription } from './store'
import { createId } from './lib/id'
import { saveAudioFile, loadApiKey, deleteAudioFile, getAudioFile, saveTranscript, deleteTranscript } from './lib/storage'
import { transcribeAudio } from './lib/elevenlabs'

const MAX_CONCURRENT_TRANSCRIPTIONS = 2

// Check if a file with the same audioFileName already exists
export const isDuplicateFile = (fileName: string): boolean => {
  const projects = useAppStore.getState().projects
  return projects.some((p) => p.audioFileName === fileName)
}

// Update a project's status and optionally other fields
export const updateProject = (
  projectId: string,
  updates: Partial<Pick<Project, 'status' | 'error' | 'audioFileId' | 'transcriptId'>>
) =>
  useAppStore.getState().mutate((s) => {
    const project = s.projects.find((p) => p.id === projectId)
    if (project) {
      Object.assign(project, updates)
    }
  })

export const deleteProject = async (projectId: string) => {
  const store = useAppStore.getState()
  const project = store.projects.find((p) => p.id === projectId)

  if (!project) return

  // Delete audio file from IndexedDB
  if (project.audioFileId) {
    try {
      await deleteAudioFile(project.audioFileId)
    } catch (error) {
      console.error('Failed to delete audio file:', error)
    }
  }

  // Delete transcript from IndexedDB
  if (project.transcriptId) {
    try {
      await deleteTranscript(project.transcriptId)
    } catch (error) {
      console.error('Failed to delete transcript:', error)
    }
  }

  // Clear transcript cache
  clearTranscriptCache(projectId)

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

// Process multiple files, creating projects immediately with loading state
export const createProjectsFromFiles = async (files: File[]) => {
  const store = useAppStore.getState()
  const apiKey = loadApiKey()

  // Filter out duplicates
  const validFiles = files.filter((file) => !isDuplicateFile(file.name))
  if (validFiles.length === 0) {
    return // All files were duplicates
  }

  // Create placeholder projects immediately with loading or error status
  const projectsToProcess: Array<{ project: Project; file: File }> = []

  store.mutate((s) => {
    for (const file of validFiles) {
      const project: Project = {
        id: createId(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        audioFileName: file.name,
        audioFileId: '',
        snippets: [],
        speakerMap: {},
        createdAt: Date.now(),
        // If no API key, mark as error immediately
        status: apiKey ? 'loading' : 'error',
        error: apiKey ? undefined : 'Please set your ElevenLabs API key in Settings',
      }
      s.projects.push(project)
      if (apiKey) {
        projectsToProcess.push({ project, file })
      }
    }
    // Select the first new project
    if (validFiles.length > 0) {
      s.selectedProjectId = s.projects[s.projects.length - validFiles.length].id
      s.selectedItem = null
      s.isPlaying = false
    }
  })

  // If no API key, we're done - projects are already marked as errors
  if (!apiKey) {
    return
  }

  const processProjectFile = async ({ project, file }: { project: Project; file: File }) => {
    // Mark as actively processing so reloads can distinguish interrupted work.
    startTranscription(project.id)

    try {
      // Save audio file FIRST so retry is possible even if transcription fails.
      const audioFileId = createId()
      await saveAudioFile(audioFileId, file)
      updateProject(project.id, { audioFileId })

      // Transcribe the audio
      const transcript = await transcribeAudio(file, apiKey)

      // Save transcript to IndexedDB
      const transcriptId = createId()
      await saveTranscript(transcriptId, project.id, transcript)

      // Update project with reference (not inline data)
      updateProject(project.id, {
        transcriptId,
        status: 'ready',
      })

      // Cache transcript for immediate use
      cacheTranscript(project.id, transcript)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      updateProject(project.id, {
        status: 'error',
        error: errorMessage,
      })
    } finally {
      endTranscription(project.id)
    }
  }

  // Keep browser memory and API pressure bounded for batch imports.
  const queue = [...projectsToProcess]
  const workerCount = Math.min(MAX_CONCURRENT_TRANSCRIPTIONS, queue.length)
  await Promise.allSettled(
    Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const item = queue.shift()
        if (item) {
          await processProjectFile(item)
        }
      }
    })
  )
}

// Retry a failed or interrupted project transcription
export const retryProject = async (projectId: string) => {
  const store = useAppStore.getState()
  const project = store.projects.find((p) => p.id === projectId)
  if (!project || !project.audioFileId) return

  const apiKey = loadApiKey()
  if (!apiKey) {
    updateProject(projectId, { status: 'error', error: 'No API key configured. Please set your ElevenLabs API key in Settings.' })
    return
  }

  // Set to loading and mark as actively transcribing
  updateProject(projectId, { status: 'loading', error: undefined })
  startTranscription(projectId)

  try {
    // Get audio file from IndexedDB
    const audioFile = await getAudioFile(project.audioFileId)
    if (!audioFile) {
      throw new Error('Audio file not found. Please delete this project and re-upload the file.')
    }

    // Transcribe
    const transcript = await transcribeAudio(audioFile, apiKey)

    // Save transcript to IndexedDB
    const transcriptId = createId()
    await saveTranscript(transcriptId, projectId, transcript)

    // Update project with reference
    updateProject(projectId, { transcriptId, status: 'ready' })

    // Cache transcript for immediate use
    cacheTranscript(projectId, transcript)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    updateProject(projectId, { status: 'error', error: errorMessage })
  } finally {
    endTranscription(projectId)
  }
}
