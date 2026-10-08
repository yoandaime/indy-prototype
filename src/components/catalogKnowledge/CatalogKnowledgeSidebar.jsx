import { NavLink } from "react-router-dom"
import { BookText, Database, Workflow, Network, TrendingUp, AlertTriangle, PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const CATALOG_KNOWLEDGE_NAV_ITEMS = [
  { to: "/catalog-knowledge/business-glossary", label: "Business Glossary", icon: BookText },
  { to: "/catalog-knowledge/data-catalog", label: "Data Catalog", icon: Database },
  { to: "/catalog-knowledge/flow-process", label: "Flow Process", icon: Workflow },
  { to: "/catalog-knowledge/metadata-lineage-discovery", label: "Metadata & Lineage Discovery", icon: Network },
]

const REPORT_MANAGEMENT_NAV_ITEMS = [
  { to: "/catalog-knowledge/passed-kpi", label: "Passed KPI", icon: TrendingUp },
  { to: "/catalog-knowledge/discrepancy", label: "Discrepancy", icon: AlertTriangle },
]

function SectionLabel({ children }) {
  return <p className="px-2 text-xs font-semibold tracking-wide text-neutral-500">{children}</p>
}

function NavList({ items }) {
  return (
    <div className="flex w-full flex-col items-start">
      {items.map(({ to, label, icon: Icon }) => (
        <Tooltip key={to}>
          <TooltipTrigger
            render={
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-neutral-700 hover:bg-muted",
                    isActive && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
                  )
                }
              />
            }
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

export default function CatalogKnowledgeSidebar({ onCollapse }) {
  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col gap-4 overflow-y-auto border-r bg-white p-4">
      <div className="flex w-full flex-col items-start gap-2">
        <div className="flex w-full items-center justify-between">
          <p className="truncate px-2 text-xs font-semibold tracking-wide text-neutral-500">Catalog Knowledge</p>
          <button
            type="button"
            aria-label="Collapse sidebar"
            onClick={onCollapse}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-foreground"
          >
            <PanelLeft className="size-3.5" />
          </button>
        </div>

        <NavList items={CATALOG_KNOWLEDGE_NAV_ITEMS} />
      </div>

      <div className="flex w-full flex-col items-start gap-2">
        <SectionLabel>Report Management</SectionLabel>
        <NavList items={REPORT_MANAGEMENT_NAV_ITEMS} />
      </div>
    </aside>
  )
}
