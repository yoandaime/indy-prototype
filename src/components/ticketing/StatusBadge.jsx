import { STATUS_META } from "@/data/ticketingData"
import { cn } from "@/lib/utils"

const ARCHIVE_META = {
  badgeClass: "bg-purple-700 text-purple-50",
  dotClass: "bg-purple-50",
  outlineClass: "bg-purple-100 border-purple-700 text-purple-700",
  outlineDotClass: "bg-purple-700",
}

export default function StatusBadge({ status, variant = "outline", className, archive }) {
  const meta = archive ? ARCHIVE_META : STATUS_META[status]
  const isOutline = variant === "outline"

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-xs",
        isOutline ? "border font-semibold" : "font-medium",
        isOutline ? meta.outlineClass : meta.badgeClass,
        className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", isOutline ? meta.outlineDotClass : meta.dotClass)} />
      {archive ? "Archive" : meta.label}
    </span>
  )
}
