import { useState } from 'react'
import { useAppStore } from '../store'
import type { ViewMode } from '../types'

export function MainPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('transcript')

  const projects = useAppStore((state) => state.projects)
  const selectedProjectId = useAppStore((state) => state.selectedProjectId)
  const transcript = useAppStore((state) => state.transcript)
  const snippets = useAppStore((state) => state.snippets)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const togglePlayback = useAppStore((state) => state.togglePlayback)
  const selectSegment = useAppStore((state) => state.selectSegment)
  const selectSnippet = useAppStore((state) => state.selectSnippet)

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  const handleOpenProjectSettings = () => {
    // TODO: Implement project settings (speaker mapping)
    console.log('Open project settings')
  }

  if (!selectedProject) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Select a project or create a new one</p>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedProject.name}
          </h2>
          <button
            onClick={handleOpenProjectSettings}
            className="text-gray-500 hover:text-gray-700"
            title="Project Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('transcript')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              viewMode === 'transcript'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Transcript
          </button>
          <button
            onClick={() => setViewMode('snippets')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              viewMode === 'snippets'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Snippets
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'transcript' ? (
          <div className="space-y-3">
            {transcript.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No transcript available
              </p>
            ) : (
              transcript.map((segment) => (
                <div
                  key={segment.id}
                  onClick={() => selectSegment(segment)}
                  className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-blue-300 hover:shadow transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-600">
                      {segment.speaker}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(segment.startTime)} -{' '}
                      {formatTime(segment.endTime)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{segment.text}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {snippets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No snippets saved yet
              </p>
            ) : (
              snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  onClick={() => selectSnippet(snippet)}
                  className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-blue-300 hover:shadow transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {snippet.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(snippet.startTime)} -{' '}
                      {formatTime(snippet.endTime)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="bg-white border-t border-gray-200 p-4 flex justify-center">
        <button
          onClick={togglePlayback}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 transition-colors"
        >
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
