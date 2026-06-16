import { useEffect, useState, useRef, useCallback } from 'react'
import { getAudioFile } from '@/lib/storage'

interface UseSnippetAudioOptions {
  audioFileId: string | undefined
  startTime: number
  endTime: number
}

interface UseSnippetAudioResult {
  audioUrl: string | null
  isGenerating: boolean
  error: string | null
  generate: () => Promise<void>
  reset: () => void
}

export function useSnippetAudio(options: UseSnippetAudioOptions): UseSnippetAudioResult {
  const { audioFileId, startTime, endTime } = options

  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const generationIdRef = useRef(0)
  const decodedAudioRef = useRef<{ audioFileId: string; buffer: AudioBuffer } | null>(null)

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
    }
  }, [])

  const reset = useCallback(() => {
    generationIdRef.current += 1
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setAudioUrl(null)
    setError(null)
    setIsGenerating(false)
  }, [])

  const decodeAudioBuffer = useCallback(async (id: string): Promise<AudioBuffer> => {
    const cached = decodedAudioRef.current
    if (cached?.audioFileId === id) {
      return cached.buffer
    }

    const audioFile = await getAudioFile(id)
    if (!audioFile) {
      throw new Error('Audio file not found')
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const audioContext = new AudioContext()

    try {
      return await audioContext.decodeAudioData(arrayBuffer)
    } finally {
      await audioContext.close()
    }
  }, [])

  const generate = useCallback(async () => {
    const generationId = generationIdRef.current + 1
    generationIdRef.current = generationId

    if (!audioFileId) {
      setIsGenerating(false)
      setError('No audio file available')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const audioBuffer = await decodeAudioBuffer(audioFileId)
      if (generationId !== generationIdRef.current) return
      decodedAudioRef.current = { audioFileId, buffer: audioBuffer }

      // Calculate sample positions
      const sampleRate = audioBuffer.sampleRate
      const startSample = Math.max(
        0,
        Math.min(Math.floor(startTime * sampleRate), audioBuffer.length)
      )
      const endSample = Math.max(
        startSample,
        Math.min(Math.ceil(endTime * sampleRate), audioBuffer.length)
      )

      if (endSample <= startSample) {
        throw new Error('Selected audio range is empty')
      }

      // Encode to WAV
      const wavBlob = audioBufferRangeToWav(audioBuffer, startSample, endSample)
      if (generationId !== generationIdRef.current) return

      // Clean up old URL if exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }

      // Create new blob URL
      const url = URL.createObjectURL(wavBlob)
      audioUrlRef.current = url
      setAudioUrl(url)
    } catch (err) {
      console.error('Failed to generate audio:', err)
      if (generationId === generationIdRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to generate audio')
      }
    } finally {
      if (generationId === generationIdRef.current) {
        setIsGenerating(false)
      }
    }
  }, [audioFileId, startTime, endTime, decodeAudioBuffer])

  return {
    audioUrl,
    isGenerating,
    error,
    generate,
    reset,
  }
}

// Convert a range of an AudioBuffer to WAV format
function audioBufferRangeToWav(
  buffer: AudioBuffer,
  startSample: number,
  endSample: number
): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const sampleCount = endSample - startSample
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  // Create WAV file
  const dataLength = sampleCount * numChannels * bytesPerSample
  const bufferLength = 44 + dataLength
  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)

  // Write WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true) // ByteRate
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  // Write audio data
  let offset = 44
  for (let i = startSample; i < endSample; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, value, true)
      offset += bytesPerSample
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
