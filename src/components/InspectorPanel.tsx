import { useAppStore } from '../store'

export function InspectorPanel() {
  const selectedItem = useAppStore((state) => state.selectedItem)

  const handleDownload = () => {
    // TODO: Implement snippet download
    console.log('Download snippet')
  }

  const handleSaveSnippet = () => {
    // TODO: Implement save snippet to project
    console.log('Save snippet to project')
  }

  if (!selectedItem) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm text-center px-4">
          Select a segment from the transcript to inspect
        </p>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Inspector
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Type Badge */}
          <div>
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                selectedItem.type === 'segment'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {selectedItem.type === 'segment'
                ? 'Transcript Segment'
                : 'Saved Snippet'}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {selectedItem.speaker && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Speaker
                </label>
                <p className="text-sm text-gray-900">{selectedItem.speaker}</p>
              </div>
            )}

            {selectedItem.name && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Name
                </label>
                <p className="text-sm text-gray-900">{selectedItem.name}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Time Range
              </label>
              <p className="text-sm text-gray-900">
                {formatTime(selectedItem.startTime)} -{' '}
                {formatTime(selectedItem.endTime)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Duration
              </label>
              <p className="text-sm text-gray-900">
                {formatDuration(selectedItem.endTime - selectedItem.startTime)}
              </p>
            </div>

            {selectedItem.text && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Text
                </label>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  {selectedItem.text}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={handleDownload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Download Snippet
        </button>

        {selectedItem.type === 'segment' && (
          <button
            onClick={handleSaveSnippet}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
            </svg>
            Save to Project
          </button>
        )}
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`
  }
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs}s`
}
