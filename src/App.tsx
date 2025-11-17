import { InspectorPanel } from '@/components/InspectorPanel'
import { MainPanel } from '@/components/MainPanel'
import { Sidebar } from '@/components/Sidebar'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

function App() {
  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Sidebar />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={55} minSize={30}>
          <MainPanel />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <InspectorPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default App
