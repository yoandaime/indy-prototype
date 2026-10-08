import { useState } from "react"
import { Outlet } from "react-router-dom"
import { PanelLeft } from "lucide-react"
import CatalogKnowledgeSidebar from "@/components/catalogKnowledge/CatalogKnowledgeSidebar"
import { cn } from "@/lib/utils"

const SIDEBAR_WIDTH = 200
const RAIL_WIDTH = 52

export default function CatalogKnowledgeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-full min-w-0 flex-1 bg-neutral-50">
      <div
        className="relative h-full shrink-0 transition-[width] duration-200 ease-in-out"
        style={{ width: sidebarOpen ? SIDEBAR_WIDTH : RAIL_WIDTH }}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-opacity duration-150 ease-in-out",
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <CatalogKnowledgeSidebar onCollapse={() => setSidebarOpen(false)} />
        </div>

        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-opacity duration-150 ease-in-out",
            sidebarOpen ? "pointer-events-none opacity-0" : "opacity-100"
          )}
        >
          <div
            className="flex h-full flex-col items-center border-r bg-white px-3 pt-4"
            style={{ width: RAIL_WIDTH }}
          >
            <button
              type="button"
              aria-label="Expand sidebar"
              onClick={() => setSidebarOpen(true)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-foreground"
            >
              <PanelLeft className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
