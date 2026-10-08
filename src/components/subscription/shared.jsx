import { CirclePlus, CircleMinus, KeyRound, RefreshCw, Ban } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle } from "@/components/ui/popover"
import { formatRelativeTime } from "@/data/subscriptionAdminData"
import { ticketAuthorInitials, ticketAuthorAvatarUrl } from "@/data/ticketingData"
import { cn } from "@/lib/utils"

// Caps how many table badges an activity row shows inline before collapsing
// the rest into a "+N more" badge — keeps a bulk subscribe/unsubscribe of
// dozens of tables from blowing up the row's height in a feed of entries
// that are otherwise one line each.
const MAX_VISIBLE_TABLES = 3

function TableBadgeList({ names }) {
  const visible = names.slice(0, MAX_VISIBLE_TABLES)
  const overflowCount = names.length - visible.length

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {visible.map((name) => (
        <Badge key={name} variant="secondary" className="font-mono text-[11px] font-normal">
          {name}
        </Badge>
      ))}
      {overflowCount > 0 && (
        <Popover>
          <PopoverTrigger onClick={(e) => e.stopPropagation()}>
            <Badge
              variant="secondary"
              className="cursor-pointer font-mono text-[11px] font-normal hover:bg-secondary/80"
            >
              +{overflowCount} more
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2.5" onClick={(e) => e.stopPropagation()}>
            <PopoverHeader>
              <PopoverTitle className="text-xs">
                {names.length} table{names.length === 1 ? "" : "s"}
              </PopoverTitle>
            </PopoverHeader>
            <div className="flex max-h-48 flex-wrap gap-1 overflow-y-auto">
              {names.map((name) => (
                <Badge key={name} variant="secondary" className="font-mono text-[11px] font-normal">
                  {name}
                </Badge>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export function TagRow({ app, category, schema, granularity }) {
  const parts = [
    app,
    category,
    schema && `Schema: ${schema}`,
    granularity && `Granularity: ${granularity}`,
  ].filter(Boolean)

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[#525252]">
      {parts.map((part, index) => (
        <span key={part} className="flex items-center gap-2">
          {index > 0 && <span className="size-[5px] shrink-0 rounded-full bg-[#e5e5e5]" />}
          {part}
        </span>
      ))}
    </div>
  )
}

export function ActivityLogEntry({ entry }) {
  const isSubscribe = entry.type === "subscribed"
  const Icon = isSubscribe ? CirclePlus : CircleMinus

  return (
    <div className="border-b pb-2 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-4 shrink-0", isSubscribe ? "text-emerald-600" : "text-red-600")} />
          <p className="text-sm leading-tight font-medium text-foreground">
            {isSubscribe ? "Subscribed" : "Unsubscribed"} {entry.tableNames.length} table
            {entry.tableNames.length === 1 ? "" : "s"}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(entry.minutesAgo)}</span>
      </div>
      <div className="pl-[22px]">
        <TableBadgeList names={entry.tableNames} />
      </div>
    </div>
  )
}

function ActivityUserAvatar({ name }) {
  return (
    <Avatar className="size-8 shrink-0">
      <AvatarImage src={ticketAuthorAvatarUrl(name)} alt={name} />
      <AvatarFallback className="text-xs font-semibold">{ticketAuthorInitials(name)}</AvatarFallback>
    </Avatar>
  )
}

// Global-feed version of ActivityLogEntry — same subscribe/unsubscribe event
// shape, plus the user it belongs to, for the admin "List Activity" tab.
export function SubscriptionActivityRow({ entry }) {
  const isSubscribe = entry.type === "subscribed"
  const Icon = isSubscribe ? CirclePlus : CircleMinus

  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-b-0">
      <ActivityUserAvatar name={entry.user.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-tight text-foreground">
            <span className="font-medium">{entry.user.name}</span>{" "}
            <Icon className={cn("mx-0.5 inline size-3.5 -translate-y-px", isSubscribe ? "text-emerald-600" : "text-red-600")} />{" "}
            {isSubscribe ? "subscribed to" : "unsubscribed from"} {entry.tableNames.length} table
            {entry.tableNames.length === 1 ? "" : "s"}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(entry.minutesAgo)}</span>
        </div>
        <TableBadgeList names={entry.tableNames} />
      </div>
    </div>
  )
}

const TOKEN_EVENT_META = {
  generated: { label: "generated a new embed key", icon: KeyRound, className: "text-blue-600" },
  regenerated: { label: "regenerated their embed key", icon: RefreshCw, className: "text-amber-600" },
  revoked: { label: "revoked their embed key", icon: Ban, className: "text-red-600" },
}

// Global feed of embed-key lifecycle events (generate / regenerate / revoke)
// across all users, for the admin "List Activity" tab's Token Activity list.
export function TokenActivityRow({ entry }) {
  const { label, icon: Icon, className } = TOKEN_EVENT_META[entry.type]

  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-b-0">
      <ActivityUserAvatar name={entry.user.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-tight text-foreground">
            <span className="font-medium">{entry.user.name}</span>{" "}
            <Icon className={cn("mx-0.5 inline size-3.5 -translate-y-px", className)} /> {label}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(entry.minutesAgo)}</span>
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground" title={entry.tokenPreview}>
          {entry.tokenPreview}…
        </p>
      </div>
    </div>
  )
}
