import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
        <Minus className="size-3" />0%
      </span>
    )
  }
  const isUp = delta > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isUp ? "text-emerald-600" : "text-red-600"
      )}
    >
      {isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(delta)}%
    </span>
  )
}
