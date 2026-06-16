import { useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import type { ImperativePanelHandle } from 'react-resizable-panels'
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
import { useAppStore } from '@/store'

function App() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null)
  const selectedItem = useAppStore((state) => state.selectedItem)

  // Global search hotkey (Ctrl+F / Cmd+F)
  useHotkeys('ctrl+f, meta+f', () => setSearchOpen(true), { preventDefault: true })

  // Migrate existing transcripts from localStorage to IndexedDB on first load
  useEffect(() => {
    migrateTranscriptsToIndexedDB().catch(console.error)
  }, [])

  const handleToggleSidebar = () => {
    if (isSidebarCollapsed) {
      sidebarPanelRef.current?.expand()
      setIsSidebarCollapsed(false)
    } else {
      sidebarPanelRef.current?.collapse()
      setIsSidebarCollapsed(true)
    }
  }

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          ref={sidebarPanelRef}
          defaultSize={20}
          minSize={15}
          maxSize={30}
          collapsible
          collapsedSize={5}
          onCollapse={() => setIsSidebarCollapsed(true)}
          onExpand={() => setIsSidebarCollapsed(false)}
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapsed={handleToggleSidebar}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={selectedItem ? 55 : 80} minSize={30}>
          <MainPanel />
        </ResizablePanel>

        {selectedItem && (
          <>
            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <InspectorPanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      <Toaster />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

export default App
