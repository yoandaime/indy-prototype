import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ticketAuthorInitials } from "@/data/ticketingData"
import { cn } from "@/lib/utils"

function formatAbsolute(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatRelative(iso, now) {
  const diffMs = now.getTime() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function FieldRow({ label, children }) {
  return (
    <div className="flex items-start gap-4 text-sm">
      <span className="w-[130px] shrink-0 text-xs tracking-wide text-neutral-500 uppercase">{label}</span>
      <div className="min-w-0 flex-1 text-foreground">{children}</div>
    </div>
  )
}

function ChangeRow({ label, from, to }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <span className="w-[130px] shrink-0 text-xs tracking-wide text-neutral-500 uppercase">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="text-neutral-400 line-through">{from}</span>
        <span aria-hidden>→</span>
        <span className="font-semibold text-foreground">{to}</span>
      </span>
    </div>
  )
}

function CreatedSnapshot({ snapshot }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold text-foreground">Ticket created</p>
      <FieldRow label="Status">{snapshot.status}</FieldRow>
      <FieldRow label="Priority">{snapshot.priority}</FieldRow>
      <FieldRow label="SLA">{snapshot.sla}</FieldRow>
      <FieldRow label="Level">{snapshot.level}</FieldRow>
      <FieldRow label="Domain">{snapshot.domain}</FieldRow>
      <FieldRow label="Scope">{snapshot.scope}</FieldRow>
      <FieldRow label="Concern">{snapshot.concern}</FieldRow>
      <FieldRow label="Category">{snapshot.category}</FieldRow>
      <FieldRow label="Description">{snapshot.description}</FieldRow>
      <FieldRow label="Attachments">{snapshot.attachmentCount} images</FieldRow>
      <FieldRow label="Resolution Files">{snapshot.resolutionFileCount} files</FieldRow>
      <FieldRow label="Issues">
        <div className="space-y-0.5">
          {snapshot.issues.map((issue, i) => (
            <p key={issue.id ?? i}>
              {issue.granularity?.toLowerCase()} · {issue.from}
              {issue.to && issue.to !== issue.from ? ` → ${issue.to}` : ""} · {issue.ipAddress} · {issue.tableName}
            </p>
          ))}
        </div>
      </FieldRow>
    </div>
  )
}

// Vertical timeline used by the ticket detail page's History tab — one
// numbered entry per audit event (creation snapshot, or a set of field
// changes such as a status transition or an Update Ticket edit).
export default function TicketHistoryTimeline({ entries }) {
  const now = new Date()

  if (entries.length === 0) {
    return <p className="p-4 text-sm text-neutral-500">No history recorded yet.</p>
  }

  return (
    <div className="flex flex-col">
      {entries.map((entry, index) => (
        <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index < entries.length - 1 && (
            <span className="absolute top-8 bottom-0 left-[15px] w-px bg-neutral-200" aria-hidden />
          )}
          <span
            className={cn(
              "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-white text-xs font-semibold",
              "border-neutral-300 text-neutral-600"
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback className="text-[10px] font-semibold">
                  {ticketAuthorInitials(entry.actor)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-foreground">{entry.actor}</span>
              <span className="text-xs text-neutral-500">
                {formatRelative(entry.at, now)} · {formatAbsolute(entry.at)}
              </span>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              {entry.kind === "created" ? (
                <CreatedSnapshot snapshot={entry.snapshot} />
              ) : (
                <div className="space-y-2">
                  {entry.changes.map((change, i) => (
                    <ChangeRow key={`${change.label}-${i}`} label={change.label} from={change.from} to={change.to} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
