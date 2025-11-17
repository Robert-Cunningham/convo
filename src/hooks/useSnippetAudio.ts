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
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setAudioUrl(null)
    setError(null)
  }, [])

  const generate = useCallback(async () => {
    if (!audioFileId) {
      setError('No audio file available')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Get the audio file from IndexedDB
      const audioFile = await getAudioFile(audioFileId)
      if (!audioFile) {
        throw new Error('Audio file not found')
      }

      // Decode the audio file
      const arrayBuffer = await audioFile.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Calculate sample positions
      const sampleRate = audioBuffer.sampleRate
      const startSample = Math.floor(startTime * sampleRate)
      const endSample = Math.floor(endTime * sampleRate)
      const numSamples = endSample - startSample
      const numChannels = audioBuffer.numberOfChannels

      // Create a new buffer for the slice
      const slicedBuffer = audioContext.createBuffer(numChannels, numSamples, sampleRate)

      // Copy the data
      for (let channel = 0; channel < numChannels; channel++) {
        const sourceData = audioBuffer.getChannelData(channel)
        const targetData = slicedBuffer.getChannelData(channel)
        for (let i = 0; i < numSamples; i++) {
          targetData[i] = sourceData[startSample + i]
        }
      }

      // Encode to WAV
      const wavBlob = audioBufferToWav(slicedBuffer)

      // Clean up old URL if exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }

      // Create new blob URL
      const url = URL.createObjectURL(wavBlob)
      audioUrlRef.current = url
      setAudioUrl(url)

      await audioContext.close()
    } catch (err) {
      console.error('Failed to generate audio:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate audio')
    } finally {
      setIsGenerating(false)
    }
  }, [audioFileId, startTime, endTime])

  return {
    audioUrl,
    isGenerating,
    error,
    generate,
    reset,
  }
}

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  // Interleave channels
  const length = buffer.length * numChannels
  const interleaved = new Float32Array(length)

  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      interleaved[i * numChannels + channel] = buffer.getChannelData(channel)[i]
    }
  }

  // Create WAV file
  const dataLength = length * bytesPerSample
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
  const offset = 44
  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]))
    const value = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    view.setInt16(offset + i * 2, value, true)
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
