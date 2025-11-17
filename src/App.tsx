import { InspectorPanel } from './components/InspectorPanel'
import { MainPanel } from './components/MainPanel'
import { Sidebar } from './components/Sidebar'

function App() {
  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar />
      <MainPanel />
      <InspectorPanel />
    </div>
  )
}

export default App
