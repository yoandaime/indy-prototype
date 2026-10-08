import { getSlaInfo } from "@/data/ticketingData"
import { cn } from "@/lib/utils"

const STATE_CLASS = {
  overdue: "bg-red-50 text-red-700",
  missed: "bg-red-50 text-red-700",
  left: "bg-amber-50 text-amber-700",
  met: "bg-green-50 text-green-700",
  unknown: "bg-neutral-100 text-neutral-700",
}

export default function SlaBadge({ ticket, className }) {
  const { state, label } = getSlaInfo(ticket)

  return (
    <span
      className={cn("rounded-lg px-2 py-0.5 text-xs font-medium whitespace-nowrap", STATE_CLASS[state], className)}
    >
      {label}
    </span>
  )
}
