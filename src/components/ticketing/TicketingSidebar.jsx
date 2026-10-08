import { NavLink, useLocation } from "react-router-dom"
import {
  Inbox,
  LayoutDashboard,
  ListChecks,
  SquareActivity,
  Timer,
  Tag,
  ClipboardList,
  Users,
  ShieldAlert,
  FolderTree,
  PanelLeft,
} from "lucide-react"
import CategoryNav from "@/components/ticketing/CategoryNav"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const TASK_FILTER_NAV_ITEMS = [
  { value: "mine", label: "My Ticket", icon: Inbox },
  { value: "all", label: "All Ticket", icon: ListChecks },
]

const ADMIN_NAV_ITEMS = [
  { to: "/ticketing/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ticketing/admin/sla", label: "SLA Management", icon: Timer },
  { to: "/ticketing/admin/pic-category", label: "PIC Category", icon: Tag },
  { to: "/ticketing/admin/audit-log", label: "Audit Log", icon: ClipboardList },
  { to: "/ticketing/admin/manage-users", label: "Manage Users", icon: Users },
  { to: "/ticketing/admin/content-moderation", label: "Content Moderation", icon: ShieldAlert },
  { to: "/ticketing/admin/manage-categories", label: "Manage Categories", icon: FolderTree },
]

function SectionLabel({ children }) {
  return <p className="px-2 text-xs font-semibold tracking-wide text-neutral-500">{children}</p>
}

export default function TicketingSidebar({
  tree,
  selectedPath,
  onSelectPath,
  onRequestCategory,
  taskFilter,
  onTaskFilterChange,
  onCollapse,
}) {
  const { pathname } = useLocation()
  const onBoardRoute = pathname === "/ticketing"

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col gap-4 overflow-y-auto border-r bg-white p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="truncate px-2 text-xs font-semibold tracking-wide text-neutral-500">NDQ Forum</p>
          <button
            type="button"
            aria-label="Collapse sidebar"
            onClick={onCollapse}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-foreground"
          >
            <PanelLeft className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {TASK_FILTER_NAV_ITEMS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onTaskFilterChange(value)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-sm text-neutral-700 hover:bg-muted",
                onBoardRoute && taskFilter === value && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}

          <NavLink
            to="/ticketing/root-cause-analysis"
            className={({ isActive }) =>
              cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-sm text-neutral-700 hover:bg-muted",
                isActive && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
              )
            }
          >
            <SquareActivity className="size-4 shrink-0" />
            <span className="truncate">Incident Analysis</span>
          </NavLink>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <SectionLabel>Category</SectionLabel>
        <CategoryNav
          tree={tree}
          selectedPath={onBoardRoute ? selectedPath : null}
          onSelectPath={onSelectPath}
          onRequestCategory={onRequestCategory}
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <SectionLabel>Admin Control Center</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex h-8 items-center gap-2 rounded-md px-2 text-sm text-neutral-700 hover:bg-muted",
                  isActive && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  )
}
