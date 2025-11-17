import type { TranscriptSegment } from '../types'

interface ScribeWord {
  text: string
  start: number
  end: number
  type: string
  speaker_id: string
  logprob: number
}

interface ScribeResponse {
  language_code: string
  language_probability: number
  text: string
  words: ScribeWord[]
  transcription_id: string
}

export async function transcribeAudio(
  file: File,
  apiKey: string
): Promise<TranscriptSegment[]> {
  const formData = new FormData()
  formData.append('model_id', 'scribe_v1')
  formData.append('file', file)
  formData.append('diarize', 'true')
  formData.append('timestamps_granularity', 'word')

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Transcription failed: ${response.status} ${errorText}`)
  }

  const result: ScribeResponse = await response.json()
  return transformScribeResponse(result)
}

function transformScribeResponse(response: ScribeResponse): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []
  let currentSegment: Partial<TranscriptSegment> | null = null

  for (const word of response.words) {
    if (!currentSegment || currentSegment.speaker !== word.speaker_id) {
      if (currentSegment && currentSegment.text) {
        segments.push(currentSegment as TranscriptSegment)
      }
      currentSegment = {
        id: crypto.randomUUID(),
        speaker: word.speaker_id,
        text: word.text,
        startTime: word.start,
        endTime: word.end,
      }
    } else {
      currentSegment.text += ' ' + word.text
      currentSegment.endTime = word.end
    }
  }

  if (currentSegment && currentSegment.text) {
    segments.push(currentSegment as TranscriptSegment)
  }

  return segments
}
