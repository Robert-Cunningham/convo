import { openDB, type DBSchema } from 'idb'
import type { TranscriptSegment } from '../types'

interface ConvoStandaloneDB extends DBSchema {
  audioFiles: {
    key: string
    value: {
      id: string
      file: File
      createdAt: number
    }
  }
  transcripts: {
    key: string
    value: {
      id: string
      projectId: string
      segments: TranscriptSegment[]
      createdAt: number
    }
    indexes: { 'by-project': string }
  }
}

const DB_NAME = 'convo-standalone'
const DB_VERSION = 2

async function getDB() {
  return openDB<ConvoStandaloneDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('audioFiles', { keyPath: 'id' })
      }
      if (oldVersion < 2) {
        const transcriptStore = db.createObjectStore('transcripts', { keyPath: 'id' })
        transcriptStore.createIndex('by-project', 'projectId')
      }
    },
  })
}

export async function saveAudioFile(id: string, file: File): Promise<void> {
  const db = await getDB()
  await db.put('audioFiles', {
    id,
    file,
    createdAt: Date.now(),
  })
}

export async function getAudioFile(id: string): Promise<File | null> {
  const db = await getDB()
  const record = await db.get('audioFiles', id)
  return record?.file ?? null
}

export async function deleteAudioFile(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('audioFiles', id)
}

// LocalStorage helpers for settings
const API_KEY_KEY = 'convo-standalone-elevenlabs-api-key'

export function saveApiKey(apiKey: string): void {
  localStorage.setItem(API_KEY_KEY, apiKey)
}

export function loadApiKey(): string | null {
  return localStorage.getItem(API_KEY_KEY)
}

// Transcript storage functions
export async function saveTranscript(
  id: string,
  projectId: string,
  segments: TranscriptSegment[]
): Promise<void> {
  const db = await getDB()
  await db.put('transcripts', {
    id,
    projectId,
    segments,
    createdAt: Date.now(),
  })
}

export async function getTranscript(id: string): Promise<TranscriptSegment[] | null> {
  const db = await getDB()
  const record = await db.get('transcripts', id)
  return record?.segments ?? null
}

export async function deleteTranscript(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('transcripts', id)
}
