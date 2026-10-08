import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Shared across the Rules Management change-request workflow and the Rules
// Catalog new-rule approval workflow — both use the same
// pending/approved/rejected shape and requester identity.
export const REQUEST_STATUS_BADGE = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
}

export function requesterDisplayName(role) {
  return role === "user" ? "William Saliba" : "Antonio Nusa"
}

export function formatDateTime(date) {
  const d = String(date.getDate()).padStart(2, "0")
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const y = date.getFullYear()
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  return `${y}-${m}-${d} · ${time}`
}

export function RequestStatusBadge({ status }) {
  const meta = REQUEST_STATUS_BADGE[status]
  if (!meta) return null
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", meta.className)}>
      {meta.label}
    </Badge>
  )
}
