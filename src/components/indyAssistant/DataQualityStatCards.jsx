import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

const TONE_CLASS = {
  positive: "text-emerald-600",
  negative: "text-red-600",
  neutral: "text-neutral-500",
}

export default function DataQualityStatCards({ items }) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const DeltaIcon = item.deltaDirection === "down" ? ArrowDown : ArrowUp
        return (
          <div key={item.label} className="rounded-lg border border-neutral-200 bg-white p-3">
            <p className="text-xs text-neutral-500">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-neutral-900">{item.value}</p>
            {item.deltaLabel && (
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 text-xs",
                  TONE_CLASS[item.tone] ?? TONE_CLASS.neutral
                )}
              >
                <DeltaIcon className="size-3" />
                {item.deltaLabel}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
