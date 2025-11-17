import { useAppStore } from '../store'

export function Sidebar() {
  const projects = useAppStore((state) => state.projects)
  const selectedProjectId = useAppStore((state) => state.selectedProjectId)
  const selectProject = useAppStore((state) => state.selectProject)

  const handleNewProject = () => {
    // TODO: Implement new project creation with file upload
    console.log('Create new project')
  }

  const handleOpenSettings = () => {
    // TODO: Implement settings modal
    console.log('Open settings')
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      {/* New Project Button */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={handleNewProject}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="text-xs uppercase text-gray-400 font-semibold px-2 mb-2">
            Projects
          </h3>
          {projects.length === 0 ? (
            <p className="text-gray-500 text-sm px-2">No projects yet</p>
          ) : (
            <ul className="space-y-1">
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    onClick={() => selectProject(project.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedProjectId === project.id
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {project.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Settings Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleOpenSettings}
          className="w-full flex items-center justify-center gap-2 text-gray-300 hover:text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
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
          Settings
        </button>
      </div>
    </div>
  )
}
