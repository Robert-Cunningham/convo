import type { Project, TranscriptSegment } from '../types'
import { getTranscript } from './storage'

export type ExportFormat = 'markdown' | 'jsonl' | 'yaml'

export interface ExportOptions {
  includeTimestamps?: boolean
  format?: ExportFormat
}

interface StructuredTranscriptLine {
  start?: number
  end?: number
  speaker: string
  text: string
}

const exportExtensions: Record<ExportFormat, string> = {
  markdown: 'md',
  jsonl: 'jsonl',
  yaml: 'yaml',
}

const exportMimeTypes: Record<ExportFormat, string> = {
  markdown: 'text/markdown;charset=utf-8',
  jsonl: 'application/x-ndjson;charset=utf-8',
  yaml: 'application/x-yaml;charset=utf-8',
}

/**
 * Gets the transcript for a project, loading from IndexedDB if needed
 */
async function getProjectTranscript(project: Project): Promise<TranscriptSegment[]> {
  // Try IndexedDB first (new format)
  if (project.transcriptId) {
    const segments = await getTranscript(project.transcriptId)
    if (segments) {
      return segments
    }
  }
  // Fall back to inline transcript (legacy format)
  return project.transcript ?? []
}

/**
 * Formats seconds into [M:SS] timestamp format
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `[${mins}:${secs.toString().padStart(2, '0')}]`
}

/**
 * Gets the display name for a speaker, using speakerMap if available
 */
export function getSpeakerDisplayName(
  speakerId: string,
  speakerMap: Record<string, string>
): string {
  if (speakerMap[speakerId]) {
    return speakerMap[speakerId]
  }
  // Convert "speaker_1" to "Speaker 1"
  const match = speakerId.match(/speaker_(\d+)/)
  if (match) {
    return `Speaker ${match[1]}`
  }
  return speakerId
}

/**
 * Normalizes whitespace in text (collapses multiple spaces to single space)
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function getExportFormat(options: ExportOptions): ExportFormat {
  return options.format ?? 'markdown'
}

function getExportExtension(format: ExportFormat): string {
  return exportExtensions[format]
}

/**
 * Formats a date as a readable string
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Exports a single project's transcript to markdown format
 * Format: [M:SS] SpeakerName: text (or just SpeakerName: text if timestamps disabled)
 */
export async function exportProjectToMarkdown(
  project: Project,
  options: ExportOptions = {}
): Promise<string> {
  const { includeTimestamps = true } = options

  const header = [
    `# ${project.name}`,
    '',
    `**Audio File:** ${project.audioFileName}`,
    `**Created:** ${formatDate(project.createdAt)}`,
    '',
    '---',
    '',
  ].join('\n')

  const segments = await getProjectTranscript(project)
  const transcript = segments
    .map((segment) => {
      const speaker = getSpeakerDisplayName(segment.speaker, project.speakerMap ?? {})
      const text = normalizeWhitespace(segment.text)
      if (includeTimestamps) {
        const timestamp = formatTimestamp(segment.startTime)
        return `${timestamp} ${speaker}: ${text}`
      }
      return `${speaker}: ${text}`
    })
    .join('\n')

  return header + transcript
}

function toStructuredTranscriptLine(
  segment: TranscriptSegment,
  speakerMap: Record<string, string>,
  includeTimestamps: boolean
): StructuredTranscriptLine {
  const speaker = getSpeakerDisplayName(segment.speaker, speakerMap)
  const text = normalizeWhitespace(segment.text)

  if (includeTimestamps) {
    return {
      start: segment.startTime,
      end: segment.endTime,
      speaker,
      text,
    }
  }

  return {
    speaker,
    text,
  }
}

async function exportProjectToStructuredLines(
  project: Project,
  options: ExportOptions = {}
): Promise<StructuredTranscriptLine[]> {
  const { includeTimestamps = true } = options
  const segments = await getProjectTranscript(project)
  return segments.map((segment) =>
    toStructuredTranscriptLine(segment, project.speakerMap ?? {}, includeTimestamps)
  )
}

/**
 * Exports a single project's transcript to JSON Lines format.
 */
export async function exportProjectToJsonLines(
  project: Project,
  options: ExportOptions = {}
): Promise<string> {
  const lines = await exportProjectToStructuredLines(project, options)
  return lines.map((line) => JSON.stringify(line)).join('\n')
}

function formatYamlValue(value: number | string): string {
  if (typeof value === 'number') {
    return String(value)
  }

  return JSON.stringify(value)
}

function exportLinesToYaml(lines: StructuredTranscriptLine[]): string {
  if (lines.length === 0) {
    return '[]'
  }

  return lines
    .map((line) =>
      Object.entries(line)
        .map(([key, value], index) => {
          const prefix = index === 0 ? '- ' : '  '
          return `${prefix}${key}: ${formatYamlValue(value)}`
        })
        .join('\n')
    )
    .join('\n')
}

/**
 * Exports a single project's transcript to YAML format.
 */
export async function exportProjectToYaml(
  project: Project,
  options: ExportOptions = {}
): Promise<string> {
  const lines = await exportProjectToStructuredLines(project, options)
  return exportLinesToYaml(lines)
}

/**
 * Exports a single project's transcript in the requested format.
 */
export async function exportProjectToFormat(
  project: Project,
  options: ExportOptions = {}
): Promise<string> {
  const format = getExportFormat(options)

  switch (format) {
    case 'jsonl':
      return exportProjectToJsonLines(project, options)
    case 'yaml':
      return exportProjectToYaml(project, options)
    case 'markdown':
      return exportProjectToMarkdown(project, options)
  }
}

/**
 * Sanitizes a filename by removing/replacing invalid characters
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid chars with underscore
    .replace(/\s+/g, '_') // Replace whitespace with underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Trim leading/trailing underscores
    .slice(0, 100) // Limit length
}

/**
 * Triggers a browser download for a single markdown file
 */
export function downloadMarkdown(content: string, filename: string): void {
  downloadExport(content, filename, 'markdown')
}

/**
 * Triggers a browser download for a single exported file
 */
export function downloadExport(content: string, filename: string, format: ExportFormat): void {
  const blob = new Blob([content], { type: exportMimeTypes[format] })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sanitizeFilename(filename)}.${getExportExtension(format)}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Gets a unique filename, appending numeric suffix if needed
 */
function getUniqueFilename(name: string, existingNames: Set<string>): string {
  let filename = sanitizeFilename(name)
  let counter = 1
  const original = filename
  while (existingNames.has(filename)) {
    filename = `${original}_${counter}`
    counter++
  }
  existingNames.add(filename)
  return filename
}

/**
 * Exports multiple projects to a single text string (for clipboard)
 */
export async function exportProjectsToText(
  projects: Project[],
  options: ExportOptions = {}
): Promise<string> {
  const format = getExportFormat(options)
  const exports = await Promise.all(
    projects.map((project) => exportProjectToFormat(project, options))
  )

  if (format === 'markdown') {
    return exports.join('\n\n---\n\n')
  }

  if (format === 'yaml') {
    return exports.join('\n---\n')
  }

  return exports.filter(Boolean).join('\n')
}

/**
 * Exports multiple projects as a ZIP file containing one file per project.
 */
export async function exportProjectsAsZip(
  projects: Project[],
  options: ExportOptions = {}
): Promise<void> {
  const JSZip = (await import('jszip')).default

  const zip = new JSZip()
  const usedFilenames = new Set<string>()
  const format = getExportFormat(options)
  const extension = getExportExtension(format)

  for (const project of projects) {
    const content = await exportProjectToFormat(project, options)
    const filename = getUniqueFilename(project.name, usedFilenames)
    zip.file(`${filename}.${extension}`, content)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'conversations-export.zip'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
