import { saveTranscript } from './storage'
import { useAppStore, cacheTranscript } from '../store'

/**
 * Migrate transcripts from localStorage (inline in projects) to IndexedDB.
 * This runs once on app load to handle existing projects created before
 * the IndexedDB migration.
 */
export async function migrateTranscriptsToIndexedDB(): Promise<void> {
  const state = useAppStore.getState()
  const projectsNeedingMigration = state.projects.filter(
    (p) => p.transcript && p.transcript.length > 0 && !p.transcriptId
  )

  if (projectsNeedingMigration.length === 0) {
    return
  }

  console.log(`Migrating ${projectsNeedingMigration.length} transcripts to IndexedDB...`)

  for (const project of projectsNeedingMigration) {
    try {
      const transcriptId = crypto.randomUUID()

      // Save to IndexedDB
      await saveTranscript(transcriptId, project.id, project.transcript!)

      // Update project with reference and cache for immediate use
      state.mutate((s) => {
        const p = s.projects.find((proj) => proj.id === project.id)
        if (p) {
          p.transcriptId = transcriptId
          // Note: we don't delete p.transcript here because it will be
          // stripped by partialize when next persisted to localStorage
        }
      })

      // Cache transcript for immediate use
      cacheTranscript(project.id, project.transcript!)
    } catch (error) {
      console.error(`Failed to migrate transcript for project ${project.id}:`, error)
    }
  }

  console.log('Migration complete')
}
