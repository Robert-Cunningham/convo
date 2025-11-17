import { openDB, type DBSchema } from 'idb'

interface ConvoStandaloneDB extends DBSchema {
  audioFiles: {
    key: string
    value: {
      id: string
      file: File
      createdAt: number
    }
  }
}

const DB_NAME = 'convo-standalone'
const DB_VERSION = 1

async function getDB() {
  return openDB<ConvoStandaloneDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('audioFiles')) {
        db.createObjectStore('audioFiles', { keyPath: 'id' })
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
