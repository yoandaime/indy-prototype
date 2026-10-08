import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// Filter pill for classifying which slice of the AI result is shown — sizing
// matches Figma node 445:18701 (Container ndq-with-shadcn) exactly: min-h
// 24px, px-2 py-[3px], rounded-lg, gap-1.5. Active state uses violet-100 fill
// with a violet-600 border; inactive uses a neutral-300 border on white.
function InsightCategoryButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[24px] shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2 py-[3px] text-xs leading-4 font-medium whitespace-nowrap text-foreground shadow-xs transition-colors",
        active
          ? "border-violet-600 bg-violet-100"
          : "border-neutral-300 bg-white hover:bg-neutral-50"
      )}
    >
      {label}
    </button>
  )
}

// AI summary alert used across Incident Management (dashboard + ticket detail).
// Colors match Figma node 354:3756 exactly: bg violet-50 (#F5F3FF), border violet-300
// (#C4B5FD), title violet-800 (#5B21B6), description violet-950 (#2E1065).
export default function IndyAssistantAlert({
  title = "INDY Assistant",
  children,
  className,
  align = "start",
  categories,
  activeCategory,
  onCategoryChange,
}) {
  return (
    <div
      className={cn(
        "flex max-h-[200px] w-full gap-4 overflow-y-auto rounded-lg border border-violet-300 bg-violet-50 px-4 py-3",
        align === "center" ? "items-center" : "items-start",
        className,
      )}
    >
      <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-600" />
      <div className="min-w-0 flex-1 space-y-1.5 text-sm">
        <div className="flex flex-col items-start gap-1.5">
          <p className="font-medium text-violet-800">{title}</p>
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((category) => (
                <InsightCategoryButton
                  key={category.key}
                  label={category.label}
                  active={category.key === activeCategory}
                  onClick={() => onCategoryChange?.(category.key)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2 pt-1.5 text-violet-950">{children}</div>
      </div>
    </div>
  )
}
