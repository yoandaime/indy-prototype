import { PRIORITY_META } from "@/data/ticketingData"
import { cn } from "@/lib/utils"

export default function PriorityBadge({ priority, className }) {
  const meta = PRIORITY_META[priority]
  if (!meta) return null

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("size-3.5 shrink-0 rounded-full", meta.dotClass)} />
      <span className={cn("text-xs font-medium whitespace-nowrap", meta.labelClass)}>{meta.label}</span>
    </span>
  )
}
