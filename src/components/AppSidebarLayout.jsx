import { Outlet } from "react-router-dom"
import AppSidebar from "@/components/AppSidebar"

export default function AppSidebarLayout() {
  return (
    <div className="flex h-screen w-full items-start bg-white">
      <AppSidebar />
      <div className="flex h-full min-w-0 flex-1 flex-col items-start">
        <div className="flex min-w-0 w-full flex-1 items-start overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
