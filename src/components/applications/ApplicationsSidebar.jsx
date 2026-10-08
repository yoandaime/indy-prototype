import { PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ApplicationsSidebar({ apps, activeKey, onSelect, onCollapse }) {
  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col gap-4 border-r border-neutral-200 bg-white p-4">
      <div className="flex w-full items-center justify-between">
        <p className="px-1 text-sm font-semibold text-foreground">Applications</p>
        <button
          type="button"
          aria-label="Collapse sidebar"
          onClick={onCollapse}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-foreground"
        >
          <PanelLeft className="size-3.5" />
        </button>
      </div>

      <div className="flex w-full flex-col gap-0.5">
        {apps.map((app) => {
          const isActive = app.key === activeKey
          return (
            <button
              key={app.key}
              type="button"
              onClick={() => onSelect(app.key)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm text-neutral-700 hover:bg-muted",
                isActive && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
              )}
            >
              <span className="truncate">{app.title}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
