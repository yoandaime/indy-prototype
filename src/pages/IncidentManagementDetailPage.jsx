import { useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom"
import { notifySuccess } from "@/lib/toast"
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Copy,
  Check,
  ChevronRight,
  Eye,
  History as HistoryIcon,
  ImageUp,
  MessageSquare,
  MessageSquareX,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  ThumbsUp,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import StatusBadge from "@/components/ticketing/StatusBadge"
import CloseArchiveDialog from "@/components/ticketing/CloseArchiveDialog"
import NewTicketDialog from "@/components/ticketing/NewTicketDialog"
import UpdateTicketDialog from "@/components/ticketing/UpdateTicketDialog"
import PicChipList from "@/components/ticketing/PicChipList"
import PriorityBadge from "@/components/ticketing/PriorityBadge"
import SlaBadge from "@/components/ticketing/SlaBadge"
import IndyAssistantFolderTabs from "@/components/ticketing/IndyAssistantFolderTabs"
import TicketHistoryTimeline from "@/components/ticketing/TicketHistoryTimeline"
import {
  CURRENT_USER,
  STATUS,
  STATUS_META,
  SLA_TARGET_MINUTES,
  buildTicketFromDraft,
  formatSlaDuration,
  getResponseSlaInfo,
  getSlaInfo,
  getTicketHistory,
  getTicketInsight,
  getTicketIssues,
  ticketAuthorEmail,
  ticketAuthorInitials,
  ticketAuthorAvatarUrl,
} from "@/data/ticketingData"
import { DEFAULT_CATEGORIES } from "@/data/picCategoryData"
import { cn } from "@/lib/utils"

const CATEGORY_OPTIONS = DEFAULT_CATEGORIES.map((c) => c.name)

// Filter pills for the INDY Assistant insight card — sizing/spacing match
// Figma node 445:18701 (Container ndq-with-shadcn).
const INSIGHT_CATEGORIES = [
  { key: "summary", label: "Summary" },
  { key: "rootCause", label: "Root Cause Analysis" },
  { key: "duplicate", label: "Duplicate / Similar Incident" },
  { key: "clustering", label: "Related Incidents" },
  { key: "recommendedAction", label: "Recommended Action" },
]

const SUMMARY_TEXT_CLASS = {
  overdue: "text-red-700",
  missed: "text-red-700",
  left: "text-foreground",
  met: "text-emerald-700",
  unknown: "text-neutral-500",
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function MatchedCriteriaBadges({ matchedCriteria }) {
  if (!matchedCriteria) return null
  const entries = Object.entries(matchedCriteria).filter(([, info]) => info?.matched)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1">
      {entries.map(([key, info]) => (
        <Badge key={key} variant="secondary" className="text-[11px] font-normal text-violet-800">
          {key === "table" ? info.sharedTables?.[0] ?? "table" : info.value ?? key}
        </Badge>
      ))}
    </div>
  )
}

function DetailRow({ label, align = "center", children }) {
  return (
    <div className={cn("flex w-full gap-5", align === "start" ? "items-start" : "items-center")}>
      <span className={cn("w-[90px] shrink-0 text-xs text-neutral-600", align === "start" && "pt-0.5")}>
        {label}
      </span>
      {children}
    </div>
  )
}

function CopyTicketIdBadge({ id }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id)
    } catch {
      // ignore clipboard errors
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <span className="flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-0.5 text-xs text-neutral-900">
      {id}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 items-center text-neutral-500 hover:text-neutral-700"
              aria-label="Copy ticket ID"
            />
          }
        >
          {copied ? (
            <Check className="size-3 text-emerald-600" />
          ) : (
            <Copy className="size-3" />
          )}
        </TooltipTrigger>
        <TooltipContent>Copy ticket ID</TooltipContent>
      </Tooltip>
      {copied && <span className="text-emerald-600">Copied</span>}
    </span>
  )
}

function Breadcrumb({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-neutral-400" />}
          <span className="text-xs text-neutral-900">{item}</span>
        </span>
      ))}
    </div>
  )
}

// Issues can carry either the current `screenshots` array or the older
// single `screenshot` object — this normalizes either shape to a list.
function getIssueScreenshots(issue) {
  if (Array.isArray(issue.screenshots)) return issue.screenshots
  return issue.screenshot ? [issue.screenshot] : []
}

// Falls back to "Issue N" for issues without a custom title.
function issueLabel(issue, index) {
  return issue.title?.trim() || `Issue ${index + 1}`
}

// One issue's full detail — period, host/table, priority, description and
// any attached screenshots. Matches the Figma "Tab Panel" reference
// (node 691:1113): label, period/granularity, host, table, priority,
// description, then a row of screenshot thumbnails.
function IssueDetail({ issue, index, onPreviewImage }) {
  const screenshots = getIssueScreenshots(issue)

  return (
    <div className="w-full space-y-2.5 rounded-lg border border-neutral-200 p-3">
      <p className="text-sm font-semibold text-foreground">{issueLabel(issue, index)}</p>

      <DetailRow label="Period">
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-900">
          <span>
            {issue.from}
            {issue.to && issue.to !== issue.from ? ` → ${issue.to}` : ""}
          </span>
          {issue.granularity && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">
              {issue.granularity.toLowerCase()}
            </span>
          )}
        </div>
      </DetailRow>

      <DetailRow label="IP Address">
        <span className="text-xs text-neutral-900">{issue.ipAddress || "—"}</span>
      </DetailRow>

      <DetailRow label="Table Name">
        <span className="text-xs text-neutral-900">{issue.tableName || "—"}</span>
      </DetailRow>

      {issue.priority && (
        <DetailRow label="Priority">
          <PriorityBadge priority={issue.priority} />
        </DetailRow>
      )}

      {issue.description && (
        <DetailRow label="Description" align="start">
          <p className="text-xs text-neutral-700">{issue.description}</p>
        </DetailRow>
      )}

      {issue.onBehalfEmail && (
        <DetailRow label="On Behalf Of">
          <span className="text-xs text-neutral-700">{issue.onBehalfEmail}</span>
        </DetailRow>
      )}

      {screenshots.length > 0 && (
        <DetailRow label="Attachment" align="start">
          <div className="flex flex-wrap gap-2">
            {screenshots.map((shot, shotIndex) => (
              <button
                key={shot.url ?? shotIndex}
                type="button"
                onClick={() => onPreviewImage?.({ url: shot.url, name: shot.name || "Attachment" })}
                className="block shrink-0"
                aria-label="Preview attached screenshot"
              >
                <img src={shot.url} alt="attachment" className="size-[60px] rounded-md border object-cover" />
              </button>
            ))}
          </div>
        </DetailRow>
      )}
    </div>
  )
}

// A single issue renders its detail directly — tabs only earn their keep once
// there's something to switch between. Pill-style tab list matches the Figma
// reference (node 691:1108): default TabsList variant, not the line style.
function IssueRows({ issues, onPreviewImage }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const safeIndex = Math.min(activeIndex, issues.length - 1)

  if (issues.length <= 1) {
    const issue = issues[0]
    if (!issue) return null
    return <IssueDetail issue={issue} index={0} onPreviewImage={onPreviewImage} />
  }

  return (
    <Tabs value={String(safeIndex)} onValueChange={(v) => setActiveIndex(Number(v))} className="w-full">
      <TabsList>
        {issues.map((issue, index) => (
          <TabsTrigger key={issue.id ?? index} value={String(index)}>
            {issueLabel(issue, index)}
          </TabsTrigger>
        ))}
      </TabsList>

      {issues.map((issue, index) => (
        <TabsContent key={issue.id ?? index} value={String(index)} className="w-full">
          <IssueDetail issue={issue} index={index} onPreviewImage={onPreviewImage} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function SummaryCard({ label, value, caption }) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-xl border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      {value}
      {caption && <p className="text-xs text-neutral-500">{caption}</p>}
    </div>
  )
}

export default function IncidentManagementDetailPage() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { tickets, setTickets, picCategories } = useOutletContext()
  const ticket = useMemo(() => tickets.find((t) => t.id === id), [tickets, id])
  const backTo = pathname.startsWith("/ticketing/admin/content-moderation")
    ? "/ticketing/admin/content-moderation"
    : "/ticketing"

  const [closeOpen, setCloseOpen] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("discussion")
  const [activeInsightCategory, setActiveInsightCategory] = useState("summary")
  const [showAudit, setShowAudit] = useState(true)
  const [replyText, setReplyText] = useState("")
  const [replyImage, setReplyImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)

  if (!ticket) {
    return (
      <div className="min-w-0 flex-1 space-y-4 bg-neutral-100 p-6">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link to={backTo} />}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          No ticket found for ID "{id}".
        </div>
      </div>
    )
  }

  const insight = getTicketInsight(ticket)
  const isOpen = ticket.status !== STATUS.closed
  const showResume = ticket.status === STATUS.open || ticket.status === STATUS.pending
  const showPutOnHold = ticket.status === STATUS.inProgress
  const showMarkSolved = isOpen && ticket.status !== STATUS.solved
  const showReopen = ticket.status === STATUS.solved

  const historyEntries = getTicketHistory(ticket)
  const responseInfo = getResponseSlaInfo(ticket)
  const resolutionInfo = getSlaInfo(ticket)
  const responseTargetMinutes = Math.round((SLA_TARGET_MINUTES[ticket.priority] ?? 0) / 2)
  const resolutionTargetMinutes = SLA_TARGET_MINUTES[ticket.priority] ?? 0

  const updateTicket = (updater) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? updater(t) : t)))
  }

  // Ends any accrued "Put on hold" time as of `now`, returning the fields to
  // merge into the ticket so hold time is excluded from SLA calculations.
  const finalizeHold = (t, now) => {
    if (!t.holdStartedAt) return { totalHoldMinutes: t.totalHoldMinutes ?? 0, holdStartedAt: null }
    const elapsed = (now.getTime() - new Date(t.holdStartedAt).getTime()) / 60000
    return { totalHoldMinutes: (t.totalHoldMinutes ?? 0) + elapsed, holdStartedAt: null }
  }

  // Appends one History tab entry to a ticket, seeding from getTicketHistory
  // first so older mock tickets (which don't carry a real `history` array
  // yet) start from an equivalent synthesized baseline.
  const withHistory = (t, changes) => [
    ...getTicketHistory(t),
    {
      id: `${t.id}-history-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actor: CURRENT_USER,
      at: new Date().toISOString(),
      kind: "change",
      changes,
    },
  ]

  const handleUpvote = () => {
    updateTicket((t) => ({ ...t, upvotes: t.upvotes + 1 }))
  }

  const handleResume = () => {
    const now = new Date()
    updateTicket((t) => ({
      ...t,
      status: STATUS.inProgress,
      firstRespondedAt: t.firstRespondedAt ?? now.toISOString(),
      ...finalizeHold(t, now),
      history: withHistory(t, [{ label: "STATUS", from: STATUS_META[t.status].label, to: STATUS_META[STATUS.inProgress].label }]),
    }))
    notifySuccess("Ticket resumed", `${ticket.id} is back in progress.`)
  }

  const handlePutOnHold = () => {
    const now = new Date()
    updateTicket((t) => ({
      ...t,
      status: STATUS.pending,
      holdStartedAt: now.toISOString(),
      history: withHistory(t, [{ label: "STATUS", from: STATUS_META[t.status].label, to: STATUS_META[STATUS.pending].label }]),
    }))
    notifySuccess("Ticket put on hold", `${ticket.id} has been put on hold.`)
  }

  const handleMarkSolved = () => {
    const now = new Date()
    updateTicket((t) => ({
      ...t,
      status: STATUS.solved,
      previousStatus: t.status,
      resolvedAt: now.toISOString(),
      ...finalizeHold(t, now),
      history: withHistory(t, [{ label: "STATUS", from: STATUS_META[t.status].label, to: STATUS_META[STATUS.solved].label }]),
    }))
    notifySuccess("Ticket marked as solved", `${ticket.id} has been marked as solved.`)
  }

  const handleReopen = () => {
    updateTicket((t) => {
      const nextStatus = t.previousStatus ?? STATUS.inProgress
      return {
        ...t,
        status: nextStatus,
        resolvedAt: null,
        history: withHistory(t, [{ label: "STATUS", from: STATUS_META[t.status].label, to: STATUS_META[nextStatus].label }]),
      }
    })
    notifySuccess("Ticket reopened", `${ticket.id} is back in progress.`)
  }

  const handleUpdateSubmit = (payload) => {
    updateTicket((t) => {
      const categoryEntry = picCategories.find((c) => c.name === payload.picCategory)
      const levelKey = payload.level?.toLowerCase()
      const escalatedPic = categoryEntry?.[levelKey]

      const changes = []
      const compare = (label, from, to) => {
        if (to !== undefined && from !== to) changes.push({ label, from: from ?? "—", to })
      }
      compare("CATEGORY", t.picCategory ?? t.category?.application, payload.picCategory)
      compare("DOMAIN", t.domain, payload.domain)
      compare("SCOPE", t.category?.scope, payload.category?.scope)
      compare("CONCERN", t.category?.concern, payload.category?.concern)
      compare("LEVEL", (t.level ?? "L0").toUpperCase(), payload.level)

      return {
        ...t,
        ...payload,
        pic: escalatedPic && escalatedPic.length > 0 ? escalatedPic : t.pic,
        history: changes.length > 0 ? withHistory(t, changes) : getTicketHistory(t),
      }
    })
    notifySuccess("Ticket updated", `Ticket ${ticket.id} information has been updated.`)
  }

  const handleDuplicateCreate = (draft) => {
    const newTicket = buildTicketFromDraft(tickets, draft)
    setTickets((prev) => [newTicket, ...prev])
    notifySuccess("Ticket duplicated", `Ticket ${newTicket.id} has been created from ${ticket.id}.`)
    navigate(`/ticketing/${newTicket.id}`)
  }

  const handleImagePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReplyImage({ name: file.name, url: URL.createObjectURL(file) })
    e.target.value = ""
  }

  const handleReplyPaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    const imageItem = Array.from(items).find((item) => item.type.startsWith("image/"))
    if (!imageItem) return
    const file = imageItem.getAsFile()
    if (!file) return
    e.preventDefault()
    setReplyImage({ name: file.name || "pasted-image.png", url: URL.createObjectURL(file) })
  }

  const handleReplySubmit = () => {
    if (!replyText.trim() && !replyImage) return
    const reply = {
      id: `r${ticket.replies.length + 1}-${Date.now()}`,
      author: "Antonio Nusa",
      createdAt: new Date().toISOString(),
      text: replyText.trim(),
      image: replyImage?.url ?? null,
    }
    updateTicket((t) => ({ ...t, replies: [...t.replies, reply] }))
    setReplyText("")
    setReplyImage(null)
  }

  const handleCloseArchive = (resolution) => {
    updateTicket((t) => ({
      ...t,
      status: STATUS.closed,
      resolution,
      resolvedAt: t.resolvedAt ?? new Date().toISOString(),
      history: withHistory(t, [
        { label: "STATUS", from: STATUS_META[t.status].label, to: STATUS_META[STATUS.closed].label },
        { label: "ROOT CAUSE", from: "—", to: resolution.rootCause },
      ]),
    }))
    notifySuccess("Ticket closed & archived", `Ticket ${ticket.id} has been closed and archived.`)
  }

  // Per-category content for the INDY Assistant folder tabs below.
  function renderInsightContent(category) {
    return (
      <>
        {category === "summary" && (
          <p>
            {insight.duplicate.isDuplicate ? (
              <>
                Kemungkinan <strong>duplikat</strong> dari tiket{" "}
                <strong>{insight.duplicate.relatedTicketId}</strong> ({insight.duplicate.similarity}% mirip).
              </>
            ) : (
              <>
                Ini kemunculan ke-<strong>{insight.occurrenceCount}</strong> untuk tabel{" "}
                <strong>{ticket.tableName}</strong>
                {insight.lastOccurred && (
                  <>
                    , terakhir terjadi pada <strong>{insight.lastOccurred}</strong>
                  </>
                )}
                . {insight.pattern}
              </>
            )}
          </p>
        )}

        {category === "rootCause" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-violet-800 uppercase">
                Root Cause Analysis{" "}
                <span className="font-normal normal-case text-violet-600">
                  ({insight.rootCause.confidence}% confidence)
                </span>
              </p>
              <p>{insight.rootCause.primary}</p>
              {insight.rootCause.contributingFactors.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-4">
                  {insight.rootCause.contributingFactors.map((factor) => (
                    <li key={factor}>{factor}</li>
                  ))}
                </ul>
              )}
            </div>

            {insight.pastIncidents.length > 0 && (
              <div className="space-y-1 border-t border-violet-200 pt-2">
                <p className="text-xs font-semibold tracking-wide text-violet-800 uppercase">
                  Past Occurrences
                </p>
                <ul className="space-y-1">
                  {insight.pastIncidents.map((past) => (
                    <li key={past.id} className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="font-medium text-violet-800">{past.id}</span>
                      <span className="text-violet-600">· {past.date} · resolved in {past.resolutionTime}</span>
                      <span className="basis-full text-violet-950 sm:basis-auto">— {past.summary}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {category === "duplicate" && (
          <div className="space-y-2">
            <p>{insight.duplicateDetection?.narrative ?? insight.duplicate.note}</p>
            {insight.duplicateDetection?.similarTickets?.length > 0 && (
              <ul className="space-y-2">
                {insight.duplicateDetection.similarTickets.map((similar) => (
                  <li key={similar.code} className="space-y-1 rounded-md border border-violet-200 bg-white/60 p-2">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      <span className="font-medium text-violet-800">{similar.code}</span>
                      <span className="text-violet-600">· {Math.round(similar.similarity * 100)}% similar</span>
                      <Badge variant={similar.resolved ? "secondary" : "outline"} className="text-[11px] font-normal">
                        {similar.resolved ? "Resolved" : "Open"}
                      </Badge>
                    </div>
                    <MatchedCriteriaBadges matchedCriteria={similar.matchedCriteria} />
                    {similar.resolutionNote && (
                      <p className="text-violet-950">{similar.resolutionNote}</p>
                    )}
                    {similar.llmVerification && (
                      <p className="text-xs text-violet-600 italic">
                        LLM verification ({similar.llmVerification.confidence}% confidence): {similar.llmVerification.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {category === "clustering" && (
          <div className="space-y-2">
            <p>{insight.clustering?.narrative}</p>
            {insight.clustering?.found && (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-violet-600">
                  <span>{insight.clustering.confidence}% confidence</span>
                  {insight.clustering.sharedSignals.tables.length > 0 && (
                    <span>Shared tables: {insight.clustering.sharedSignals.tables.join(", ")}</span>
                  )}
                  {insight.clustering.sharedSignals.problemTypes.length > 0 && (
                    <span>Problem types: {insight.clustering.sharedSignals.problemTypes.join(", ")}</span>
                  )}
                </div>
                {insight.clustering.relatedTickets.length > 0 && (
                  <ul className="space-y-1">
                    {insight.clustering.relatedTickets.map((related) => (
                      <li key={related.code} className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="font-medium text-violet-800">{related.code}</span>
                        <span className="basis-full text-violet-950 sm:basis-auto">— {related.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}

        {category === "recommendedAction" && <p>{insight.recommendedAction}</p>}
      </>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-neutral-100">
      <div className="flex shrink-0 flex-col items-start gap-4 border-b border-neutral-200 bg-white px-36 py-6 shadow-xs">
        <div className="flex w-full items-start justify-between">
          <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link to={backTo} />}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setDuplicateOpen(true)}>
              <Copy className="size-4" />
              Duplicate
            </Button>
            {isOpen && (
              <Button variant="outline" onClick={() => setUpdateOpen(true)}>
                <Pencil className="size-4" />
                Update
              </Button>
            )}
            {showResume && (
              <Button variant="outline" onClick={handleResume}>
                <Play className="size-4" />
                Resume
              </Button>
            )}
            {showPutOnHold && (
              <Button variant="outline" onClick={handlePutOnHold}>
                <Pause className="size-4" />
                Put on hold
              </Button>
            )}
            {showMarkSolved && (
              <Button variant="outline" onClick={handleMarkSolved}>
                <CircleCheck className="size-4" />
                Mark as solved
              </Button>
            )}
            {showReopen && (
              <Button variant="outline" onClick={handleReopen}>
                <RotateCcw className="size-4" />
                Reopen
              </Button>
            )}
            {isOpen && <Button onClick={() => setCloseOpen(true)}>Submit Close & Archive</Button>}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4.5">
          <div className="flex w-full flex-col rounded-tl-[14px] rounded-tr-[14px] rounded-bl-[22px] rounded-br-[22px] border border-neutral-200 bg-neutral-100 p-[5px]">
            <div className="flex w-full flex-col gap-4 overflow-hidden rounded-tl-[14px] rounded-tr-[14px] rounded-bl-[22px] rounded-br-[22px] border border-neutral-200 bg-white p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <Avatar>
                    {ticketAuthorAvatarUrl(ticket.author) && (
                      <AvatarImage src={ticketAuthorAvatarUrl(ticket.author)} alt={ticket.author} />
                    )}
                    <AvatarFallback className="font-semibold">{ticketAuthorInitials(ticket.author)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{ticket.author}</p>
                    <p className="text-xs text-neutral-600">{ticketAuthorEmail(ticket.author)}</p>
                  </div>
                </div>

                <h1 className="text-3xl leading-[30px] font-semibold tracking-[-1px] text-foreground">
                  {ticket.title}
                </h1>

                <div className="flex flex-wrap gap-2 text-xs text-sky-600">
                  {ticket.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>

              <div className="h-px w-full bg-neutral-200" />

              <div className="flex flex-col gap-2.5">
                <DetailRow label="Status">
                  <StatusBadge status={ticket.status} />
                </DetailRow>
                <DetailRow label="SLA">
                  <SlaBadge ticket={ticket} />
                </DetailRow>
                <DetailRow label="Ticket ID">
                  <CopyTicketIdBadge id={ticket.id} />
                </DetailRow>
                <DetailRow label="Issue Category">
                  <Breadcrumb
                    items={[
                      ticket.kind ?? "Kendala",
                      ticket.picCategory ?? ticket.category.application,
                      ticket.domain,
                      ticket.category.scope,
                      ticket.category.concern,
                    ].filter(Boolean)}
                  />
                </DetailRow>
                <DetailRow label="Category">
                  <span className="text-xs text-neutral-900">{ticket.picCategory ?? ticket.category.application}</span>
                </DetailRow>
                <DetailRow label="Domain">
                  <span className="text-xs text-neutral-900">{ticket.domain || "—"}</span>
                </DetailRow>
                <DetailRow label="Issues" align="start">
                  <IssueRows issues={getTicketIssues(ticket)} onPreviewImage={setPreviewImage} />
                </DetailRow>
                <DetailRow label="Level">
                  <span className="text-xs font-medium text-neutral-900">{(ticket.level ?? "L0").toUpperCase()}</span>
                </DetailRow>
                <DetailRow label="PIC">
                  <PicChipList pic={ticket.pic} />
                </DetailRow>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5">
              <Button variant="outline" onClick={handleUpvote}>
                <ThumbsUp className="size-4" />
                {ticket.upvotes} {ticket.upvotes === 1 ? "Upvote" : "Upvotes"}
              </Button>
              <span className="flex items-center gap-1 text-sm text-neutral-600">
                <MessageSquare className="size-4.5" />
                {ticket.replies.length} replies
              </span>
              <span className="flex items-center gap-1 text-sm text-neutral-600">
                <Eye className="size-4.5" />
                {ticket.views} {ticket.views === 1 ? "view" : "views"}
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <SummaryCard
              label={`Response (${responseTargetMinutes}m target)`}
              value={<p className={cn("text-sm font-semibold", SUMMARY_TEXT_CLASS[responseInfo.state])}>{responseInfo.label}</p>}
            />
            <SummaryCard
              label={`Resolution (${resolutionTargetMinutes}m target)`}
              value={<p className={cn("text-sm font-semibold", SUMMARY_TEXT_CLASS[resolutionInfo.state])}>{resolutionInfo.label}</p>}
            />
            <SummaryCard
              label="Priority"
              value={<PriorityBadge priority={ticket.priority} />}
              caption={`Excludes ${formatSlaDuration(ticket.totalHoldMinutes ?? 0)} on hold`}
            />
          </div>

          {ticket.status === STATUS.solved && (
            <div className="flex w-full items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CircleCheck className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-semibold">Marked as Solved</p>
                <p>
                  This ticket is resolved. Reopen it if the issue returns, or Submit Close &amp; Archive to record
                  the root cause and archive it.
                </p>
              </div>
            </div>
          )}

          {ticket.resolution && (
            <div className="w-full space-y-2 rounded-xl border border-neutral-200 p-4">
              <h2 className="text-base font-semibold text-foreground">Resolution</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-neutral-500">Root Cause Analysis</p>
                  <p className="text-sm text-foreground">{ticket.resolution.rootCause}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Suspect System / Pipeline</p>
                  <p className="text-sm text-foreground">{ticket.resolution.suspectSystem}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Resolution Notes</p>
                  <p className="text-sm text-foreground">{ticket.resolution.resolutionNotes}</p>
                </div>
              </div>
            </div>
          )}

          {showAudit && (
            <div className="flex w-full items-start gap-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
              <div className="flex flex-1 items-start gap-3 text-sm text-amber-700">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <p className="font-semibold">Audit Trail Policy</p>
                  <p>
                    Tickets cannot be arbitrarily deleted, to maintain SLA compliance. Once the issue is resolved,
                    use Solve to record the root cause, then Close &amp; Archive.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAudit(false)}
                className="text-amber-700 hover:text-amber-900"
                aria-label="Dismiss audit trail policy notice"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <IndyAssistantFolderTabs
            categories={INSIGHT_CATEGORIES}
            activeCategory={activeInsightCategory}
            onCategoryChange={setActiveInsightCategory}
          >
            {renderInsightContent(activeInsightCategory)}
          </IndyAssistantFolderTabs>

          <div className="flex w-full flex-col gap-4.5 bg-white">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList variant="line">
                <TabsTrigger value="discussion">
                  <MessageSquare />
                  Discussion & Replies ({ticket.replies.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  <HistoryIcon />
                  History ({historyEntries.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discussion" className="flex flex-col gap-4.5 pt-4.5">
                <div className="flex h-[312px] w-full flex-col items-start gap-4 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  {ticket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="flex w-fit max-w-full shrink-0 items-start gap-3.5 rounded-[10px] border border-neutral-200 bg-white p-3"
                    >
                      <Avatar size="sm" className="shrink-0">
                        <AvatarFallback>{ticketAuthorInitials(reply.author)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2 text-neutral-600">
                          <span className="text-sm font-semibold text-foreground">{reply.author}</span>
                          <span className="text-xs">{formatDateTime(reply.createdAt)}</span>
                        </div>
                        {reply.text && <p className="text-base leading-6 text-foreground">{reply.text}</p>}
                        {reply.image && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: reply.image, name: "Attachment" })}
                            className="mt-2 block shrink-0"
                            aria-label="Preview attached image"
                          >
                            <img
                              src={reply.image}
                              alt="attachment"
                              className="max-h-40 rounded-md border object-cover"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {ticket.replies.length === 0 && (
                    <div className="flex shrink-0 items-center gap-2 p-5">
                      <MessageSquareX className="size-5 shrink-0 text-neutral-500" />
                      <p className="text-sm text-neutral-500">No replies yet. Be the first to respond.</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex min-h-[76px] w-full flex-col gap-4 rounded-lg border border-input bg-transparent px-2.5 py-2 shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                    {replyImage && (
                      <div className="flex w-fit items-center gap-2 rounded-lg border bg-neutral-50 py-1 pr-2 pl-1">
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: replyImage.url, name: replyImage.name })}
                          className="shrink-0"
                          aria-label="Preview attached image"
                        >
                          <img src={replyImage.url} alt={replyImage.name} className="size-10 rounded object-cover" />
                        </button>
                        <span className="max-w-40 truncate text-xs text-neutral-600">{replyImage.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setReplyImage(null)
                          }}
                          aria-label="Remove attached image"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )}
                    <Textarea
                      placeholder="Type your message here."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onPaste={handleReplyPaste}
                      className="min-h-0 flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImagePick}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <ImageUp className="size-4" />
                      Attach image
                    </Button>
                    <Button size="sm" onClick={handleReplySubmit} disabled={!replyText.trim() && !replyImage}>
                      Post Reply
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="pt-4.5">
                <TicketHistoryTimeline entries={historyEntries} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <CloseArchiveDialog open={closeOpen} onOpenChange={setCloseOpen} onSubmit={handleCloseArchive} />

      <NewTicketDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        mode="duplicate"
        sourceTicket={ticket}
        onCreate={handleDuplicateCreate}
      />

      <UpdateTicketDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        ticket={ticket}
        categoryOptions={CATEGORY_OPTIONS}
        onSubmit={handleUpdateSubmit}
      />

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle>{previewImage?.name}</DialogTitle>
          {previewImage && (
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
