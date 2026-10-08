import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Menu,
  PanelLeft,
  SquareChevronRight,
  LayoutGrid,
  Ticket,
  Eye,
  FilePlus2,
  Rss,
  BookOpen,
  Sparkle,
  ChevronsUpDown,
  User,
  LogOut,
  RotateCcw,
} from "lucide-react"
import indyLogoMark from "@/assets/indy-logo-mark.svg"
import indyLogo from "@/assets/indy-logo.svg"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ticketAuthorAvatarUrl, ticketAuthorInitials } from "@/data/ticketingData"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useAccess } from "@/context/AccessContext"

const CURRENT_USER_NAME = "Antonio Nusa"

// Prototype-only mock data persisted to localStorage (see useLocalStorageState) —
// cleared by "Reset Demo Data" so a stale demo doesn't linger across sessions.
const DEMO_DATA_STORAGE_KEYS = ["indy-rules-management-rows", "indy-rules-change-requests"]

function handleResetDemoData() {
  for (const key of DEMO_DATA_STORAGE_KEYS) window.localStorage.removeItem(key)
  window.location.reload()
}

const MENU_ITEMS = [
  { key: "applications", label: "Applications", icon: LayoutGrid, path: "/applications" },
  { key: "ticketing", label: "Incident Management", icon: Ticket, path: "/ticketing" },
  { key: "data-observability", label: "DQ Experience", icon: Eye, path: "/data-observability" },
  { key: "enrich-data", label: "Enrich Data", icon: FilePlus2, path: "/enrich-data/admin" },
  { key: "customer-data-ops", label: "Customer Data Ops", icon: Rss, path: "/customer-data-ops" },
  { key: "catalog-knowledge", label: "Data Driven Catalog", icon: BookOpen, path: "/catalog-knowledge" },
  { key: "indy-assistant", label: "INDY Assistant", icon: Sparkle, path: "/indy-assistant" },
]

// Height of the persistent hamburger notch in the hover peek (pt-4 + icon + pb-3).
const NOTCH_HEIGHT = 48

function MenuList() {
  const { pathname } = useLocation()

  return (
    <div className="flex w-full flex-col items-start gap-0">
      {MENU_ITEMS.map(({ key, label, icon: Icon, path }) => {
        const isActive = Boolean(path) && pathname.startsWith(path)
        const className = cn(
          "flex h-8 w-full items-center gap-2 rounded-md px-3 py-1 text-sm text-sidebar-foreground",
          isActive && "bg-[#fdecee] text-primary",
          path && !isActive && "hover:bg-neutral-100"
        )

        if (path) {
          return (
            <Tooltip key={key}>
              <TooltipTrigger render={<Link to={path} className={className} />}>
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{label}</span>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          )
        }

        return (
          <Tooltip key={key}>
            <TooltipTrigger render={<div className={className} />}>
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

function UserFooter({ expanded }) {
  const { role, setRole } = useAccess()
  const navigate = useNavigate()
  const isUser = role === "user"
  const roleLabel = isUser ? "User" : "Admin"
  const displayName = isUser ? "William Saliba" : CURRENT_USER_NAME

  function handleSignOut() {
    setRole(null)
    navigate("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full shrink-0 items-center gap-2 border-t border-neutral-100 bg-white p-4 outline-none hover:bg-neutral-50",
          !expanded && "justify-center"
        )}
      >
        <Avatar className="size-6 shrink-0 bg-neutral-100">
          {ticketAuthorAvatarUrl(displayName) && (
            <AvatarImage src={ticketAuthorAvatarUrl(displayName)} alt={displayName} />
          )}
          <AvatarFallback className="text-xs">{ticketAuthorInitials(displayName)}</AvatarFallback>
        </Avatar>
        {expanded && (
          <>
            <div className="flex min-w-0 flex-1 flex-col justify-center whitespace-nowrap text-left">
              <p className="text-sm font-medium text-neutral-900">{displayName}</p>
              <p className="text-xs text-neutral-600">{roleLabel}</p>
            </div>
            <ChevronsUpDown className="size-3.5 shrink-0 text-neutral-400" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetDemoData}>
            <RotateCcw />
            Reset Demo Data
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Full expanded content: used both for the pinned "opened" state (with the
// panel-left collapse button) and the hover peek (no button, per Figma).
function ExpandedPanel({ onCollapse, floating = false }) {
  return (
    <div
      className={cn(
        "flex h-full w-[224px] flex-col items-start justify-between overflow-clip border-r border-neutral-200 bg-[#FFFFFF]",
        floating && "w-[226.5px] rounded-tr-lg rounded-br-lg border border-neutral-200 shadow-lg"
      )}
    >
      <div className="flex w-full flex-col items-start gap-3 p-4">
        <div className="flex w-full items-center justify-between">
          <Link to="/" className="ml-3">
            <img src={indyLogo} alt="INDY" className="h-6 w-auto" />
          </Link>
          {!floating && (
            <button
              type="button"
              aria-label="Collapse sidebar"
              onClick={onCollapse}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-foreground"
            >
              <PanelLeft className="size-3.5" />
            </button>
          )}
        </div>
        <MenuList />
      </div>
      <UserFooter expanded />
    </div>
  )
}

// Persistent notch shown above the rail/peek — just the hamburger, matching
// Figma node 280:11034's "Menu Icon" container.
function HoverNotch({ onExpand }) {
  const [iconHovered, setIconHovered] = useState(false)
  const Icon = iconHovered ? SquareChevronRight : Menu

  return (
    <div
      className="flex w-[61px] items-center justify-center border-r border-neutral-200 bg-[#FCFCFC] pt-4"
      style={{ height: NOTCH_HEIGHT }}
    >
      <button
        type="button"
        aria-label="Expand sidebar"
        onClick={onExpand}
        onMouseEnter={() => setIconHovered(true)}
        onMouseLeave={() => setIconHovered(false)}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-200 hover:text-foreground"
      >
        <Icon className="size-3.5" />
      </button>
    </div>
  )
}

export default function AppSidebar() {
  const [open, setOpen] = useState(true)
  const [hovering, setHovering] = useState(false)

  function expand() {
    setHovering(false)
    setOpen(true)
  }

  // Layout-affecting box: always reserves real space (224 opened, 61 closed),
  // animating smoothly between them so content beside the sidebar resizes
  // in step instead of jumping.
  return (
    <div
      className="relative h-full shrink-0 transition-[width] duration-200 ease-in-out"
      style={{ width: open ? 224 : 61 }}
    >
      {/* Pinned "opened" layer — always mounted so open/close crossfades
          instead of popping, kept in sync with the width transition above. */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-opacity duration-150 ease-in-out",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <ExpandedPanel onCollapse={() => setOpen(false)} />
      </div>

      {/* Closed rail layer — the hover hit-area still grows from 61 to
          207.5 (with its own smooth width transition) so moving deeper into
          the peek doesn't dismiss it; only ONE of rail-body/peek is
          interactive at a time, but both stay mounted for a clean crossfade. */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-opacity duration-150 ease-in-out",
          open ? "pointer-events-none opacity-0" : "opacity-100"
        )}
        style={{ width: hovering ? 207.5 : 61, transition: "width 150ms ease-in-out" }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Hamburger notch stays visible and clickable in both closed and hover. */}
        <HoverNotch onExpand={expand} />

        <div className="relative" style={{ height: `calc(100% - ${NOTCH_HEIGHT}px)` }}>
          <div
            className={cn(
              "absolute inset-y-0 left-0 flex w-[61px] flex-col items-center justify-between overflow-clip border-r border-neutral-200 bg-[#FCFCFC] transition-opacity duration-150 ease-in-out",
              hovering ? "pointer-events-none opacity-0" : "opacity-100"
            )}
          >
            <div className="flex w-full flex-col items-center pt-3">
              <Link to="/">
                <img src={indyLogoMark} alt="INDY" className="h-6 w-auto" />
              </Link>
            </div>
            <UserFooter expanded={false} />
          </div>

          <div
            className={cn(
              "absolute inset-y-0 left-0 z-30 transition-opacity duration-150 ease-in-out",
              hovering ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <ExpandedPanel floating />
          </div>
        </div>
      </div>
    </div>
  )
}
