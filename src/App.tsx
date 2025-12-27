import { useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { InspectorPanel } from '@/components/InspectorPanel'
import { MainPanel } from '@/components/MainPanel'
import { SearchDialog } from '@/components/SearchDialog'
import { Sidebar } from '@/components/Sidebar'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Toaster } from '@/components/ui/sonner'
import { migrateTranscriptsToIndexedDB } from '@/lib/migration'

function App() {
  const [searchOpen, setSearchOpen] = useState(false)

  // Global search hotkey (Ctrl+F / Cmd+F)
  useHotkeys('ctrl+f, meta+f', () => setSearchOpen(true), { preventDefault: true })

  // Migrate existing transcripts from localStorage to IndexedDB on first load
  useEffect(() => {
    migrateTranscriptsToIndexedDB().catch(console.error)
  }, [])

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
      <Toaster />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

export default App
