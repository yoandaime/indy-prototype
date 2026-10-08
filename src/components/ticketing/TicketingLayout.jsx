import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { PanelLeft } from "lucide-react"
import TicketingSidebar from "@/components/ticketing/TicketingSidebar"
import RequestCategoryDialog from "@/components/ticketing/RequestCategoryDialog"
import { DEFAULT_CATEGORY_TREE, TICKETS } from "@/data/ticketingData"
import { DEFAULT_CATEGORIES } from "@/data/picCategoryData"
import { cn } from "@/lib/utils"

const SIDEBAR_WIDTH = 240
const RAIL_WIDTH = 52

export default function TicketingLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedCategoryPath, setSelectedCategoryPath] = useState(null)
  const [requestCategoryOpen, setRequestCategoryOpen] = useState(false)
  const [tickets, setTickets] = useState(TICKETS)
  const [pinnedIds, setPinnedIds] = useState([])
  const [picCategories, setPicCategories] = useState(DEFAULT_CATEGORIES)
  const [taskFilter, setTaskFilter] = useState("all")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSelectPath = (path) => {
    setSelectedCategoryPath(path)
    setTaskFilter(path ? null : "all")
    if (location.pathname !== "/ticketing") {
      navigate("/ticketing")
    }
  }

  const handleTaskFilterChange = (next) => {
    setTaskFilter(next)
    setSelectedCategoryPath(null)
    if (location.pathname !== "/ticketing") {
      navigate("/ticketing")
    }
  }

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
          <TicketingSidebar
            tree={DEFAULT_CATEGORY_TREE}
            selectedPath={selectedCategoryPath}
            onSelectPath={handleSelectPath}
            onRequestCategory={() => setRequestCategoryOpen(true)}
            taskFilter={taskFilter}
            onTaskFilterChange={handleTaskFilterChange}
            onCollapse={() => setSidebarOpen(false)}
          />
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
        <Outlet
          context={{
            selectedCategoryPath,
            tickets,
            setTickets,
            pinnedIds,
            setPinnedIds,
            picCategories,
            setPicCategories,
            taskFilter,
          }}
        />
      </div>

      <RequestCategoryDialog open={requestCategoryOpen} onOpenChange={setRequestCategoryOpen} />
    </div>
  )
}
