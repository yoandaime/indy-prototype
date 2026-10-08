import { useState } from "react"
import { PanelLeft } from "lucide-react"
import ApplicationsSidebar from "@/components/applications/ApplicationsSidebar"
import MainDashboardView from "@/components/applications/MainDashboardView"
import mainDashboardIcon from "@/assets/application-icons/kind=main dashboard.png"
import customReportIcon from "@/assets/application-icons/kind=custom report.png"
import botIcon from "@/assets/application-icons/kind=bot.png"
import { cn } from "@/lib/utils"

const SIDEBAR_WIDTH = 200
const RAIL_WIDTH = 52

const APPLICATIONS = [
  {
    key: "main-dashboard",
    title: "Main Dashboard",
    description: "Get insight of Data Quality",
    icon: mainDashboardIcon,
  },
  {
    key: "custom-report",
    title: "Custom Report",
    description: "Set data visualization preference",
    icon: customReportIcon,
  },
  {
    key: "indy-bot-telegram",
    title: "INDY BOT Telegram",
    description: "Monitor and connect with INDY in Telegram easily.",
    icon: botIcon,
  },
]

function ComingSoon({ app }) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-2 bg-neutral-50 px-6 text-center">
      <p className="text-base font-medium text-foreground">{app.title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{app.description}</p>
      <p className="text-sm font-medium text-neutral-400">Coming soon</p>
    </div>
  )
}

export default function ApplicationsPage() {
  const [activeKey, setActiveKey] = useState("main-dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const activeApp = APPLICATIONS.find((a) => a.key === activeKey) ?? APPLICATIONS[0]

  return (
    <div className="flex h-full min-w-0 flex-1 items-start">
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
          <ApplicationsSidebar
            apps={APPLICATIONS}
            activeKey={activeKey}
            onSelect={setActiveKey}
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
            className="flex h-full flex-col items-center border-r border-neutral-200 bg-white px-3 pt-4"
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

      {activeApp.key === "main-dashboard" ? (
        <MainDashboardView />
      ) : (
        <ComingSoon app={activeApp} />
      )}
    </div>
  )
}
