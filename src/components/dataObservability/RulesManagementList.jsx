import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, RefreshCw, Search, Copy, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { getStandardRules, getDimensionKeys } from "@/lib/dqComposer/ruleCatalog"
import { cn } from "@/lib/utils"
import { RequestStatusBadge, requesterDisplayName } from "@/lib/requestStatus"
import { useAccess } from "@/context/AccessContext"
import SqlCodeBlock from "@/components/dataObservability/SqlCodeBlock"

function FieldStat({ label, value }) {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xs text-foreground">{value}</p>
    </div>
  )
}

// Requires a reason before a rule request can be rejected — same pattern as
// the change-request reject flow in Rules Management.
function RejectRuleRequestDialog({ open, onOpenChange, onConfirm }) {
  const [reason, setReason] = useState("")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("")
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject rule request</DialogTitle>
          <DialogDescription>Let the requester know why this rule wasn't approved.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejecting (required)"
            className="field-sizing-fixed h-24 resize-none text-sm"
            autoFocus
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason.trim())
              setReason("")
            }}
          >
            Confirm Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RuleRequestsSection({ ruleRequests, isAdmin, onAddNew, onApproveRequest, onRejectRequest }) {
  const [rejectTarget, setRejectTarget] = useState(null)

  const sortedRequests = useMemo(
    () => [...ruleRequests].sort((a, b) => b.requestedAtMs - a.requestedAtMs),
    [ruleRequests]
  )

  function handleRefresh() {
    toast.success("Requests refreshed")
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto px-8 pt-[18px] pb-8">
      <div className="flex w-full items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Request New Rules</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Review new rule submissions from users and approve or reject each request."
              : "Track the status of your submitted rule requests."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" onClick={onAddNew}>
            <Plus className="size-4" />
            Add New Rule
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <Accordion className="px-4">
          {sortedRequests.map((request) => {
            const numerator = request.num ?? request.numerator
            const denominator = request.denom ?? request.denominator

            return (
              <AccordionItem key={request.id} value={request.id} className="not-last:border-b border-neutral-200">
                <AccordionTrigger className="rounded-lg px-2 py-4 hover:bg-muted/60 hover:no-underline">
                  <div className="flex w-full items-start justify-between gap-4 pr-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{request.title}</p>
                        <Badge variant="outline" className="border-transparent bg-muted font-medium text-muted-foreground">
                          {request.dimension}
                        </Badge>
                        <RequestStatusBadge status={request.status} />
                      </div>
                      <p className="mt-0.5 text-sm font-normal text-muted-foreground">{request.description}</p>
                      <p className="mt-1 text-xs font-normal text-muted-foreground">
                        Requested by {request.requestedBy} · {request.requestedAt}
                      </p>
                    </div>
                    {isAdmin && request.status === "pending" && (
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setRejectTarget(request.id)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation()
                              setRejectTarget(request.id)
                            }
                          }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <X className="size-3.5" />
                          Reject
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            onApproveRequest(request.id)
                            toast.success(`"${request.title}" approved`)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation()
                              onApproveRequest(request.id)
                            }
                          }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          <Check className="size-3.5" />
                          Approve
                        </span>
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mb-4 grid grid-cols-4 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm [&>*]:border-r [&>*]:border-neutral-200 [&>*:last-child]:border-r-0">
                    <FieldStat label="Numerator" value={numerator} />
                    <FieldStat label="Denominator" value={denominator} />
                    <FieldStat label="Rate" value={request.rate} />
                    <FieldStat label="Requested by" value={request.requestedBy} />
                  </div>

                  {request.status === "rejected" && request.reviewNote && (
                    <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
                      <span className="font-medium">Rejection reason: </span>
                      {request.reviewNote}
                    </p>
                  )}

                  <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs whitespace-pre text-neutral-700">
                    <SqlCodeBlock code={request.template} />
                  </pre>
                </AccordionContent>
              </AccordionItem>
            )
          })}

          {sortedRequests.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No rule requests yet.</p>
          )}
        </Accordion>
      </div>

      <RejectRuleRequestDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(next) => !next && setRejectTarget(null)}
        onConfirm={(reason) => {
          onRejectRequest(rejectTarget, reason)
          setRejectTarget(null)
        }}
      />
    </div>
  )
}

export default function RulesManagementList({ customRules, ruleRequests, onAddNew, onEdit, onApproveRequest, onRejectRequest }) {
  const { role } = useAccess()
  const isAdmin = role !== "user"

  // Admins review requests from everyone; a requester only sees their own —
  // otherwise a "user" tab would show other people's pending requests.
  const currentUserName = requesterDisplayName(role)
  const visibleRuleRequests = isAdmin
    ? ruleRequests
    : ruleRequests.filter((r) => r.requestedBy === currentUserName)

  const dimensionKeys = getDimensionKeys()
  const allRules = useMemo(() => {
    const customKeys = new Set(customRules.map((r) => r.key))
    return [...getStandardRules().filter((r) => !customKeys.has(r.key)), ...customRules]
  }, [customRules])

  const [view, setView] = useState("catalog")
  const [activeDimension, setActiveDimension] = useState("all")
  const [search, setSearch] = useState("")

  const pendingRequestCount = visibleRuleRequests.filter((r) => r.status === "pending").length

  const countsByDimension = useMemo(() => {
    const counts = {}
    for (const key of dimensionKeys) counts[key] = allRules.filter((r) => r.dimension === key).length
    return counts
  }, [allRules, dimensionKeys])

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allRules.filter((r) => {
      const matchesDimension = activeDimension === "all" || r.dimension === activeDimension
      const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.key.toLowerCase().includes(q)
      return matchesDimension && matchesSearch
    })
  }, [allRules, activeDimension, search])

  function handleRefresh() {
    setSearch("")
    setActiveDimension("all")
    toast.success("Rules refreshed")
  }

  function handleCopy(template) {
    navigator.clipboard?.writeText(template)
    toast.success("Query template copied")
  }

  function selectDimension(key) {
    setView("catalog")
    setActiveDimension(key)
  }

  return (
    <div className="flex h-full w-full flex-1 overflow-hidden">
      <aside className="flex h-full w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-neutral-200 bg-white p-4">
        <button
          type="button"
          onClick={() => selectDimension("all")}
          className={cn(
            "flex h-8 items-center justify-between gap-2 rounded-md px-2 text-sm text-neutral-700 hover:bg-muted",
            view === "catalog" && activeDimension === "all" && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
          )}
        >
          <span className="truncate">All rules</span>
          <span
            className={cn(
              "text-xs",
              view === "catalog" && activeDimension === "all" ? "text-primary" : "text-muted-foreground"
            )}
          >
            {allRules.length}
          </span>
        </button>

        {dimensionKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => selectDimension(key)}
            className={cn(
              "flex h-8 items-center justify-between gap-2 rounded-md px-2 text-sm text-neutral-700 hover:bg-muted",
              view === "catalog" && activeDimension === key && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
            )}
          >
            <span className="truncate">{key}</span>
            <span
              className={cn(
                "text-xs",
                view === "catalog" && activeDimension === key ? "text-primary" : "text-muted-foreground"
              )}
            >
              {countsByDimension[key] || 0}
            </span>
          </button>
        ))}

        <div className="my-2 h-px w-full bg-neutral-200" />

        <button
          type="button"
          onClick={() => setView("requests")}
          className={cn(
            "flex h-8 items-center justify-between gap-2 rounded-md px-2 text-sm text-neutral-700 hover:bg-muted",
            view === "requests" && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
          )}
        >
          <span className="truncate">Request New Rules</span>
          {pendingRequestCount > 0 && <span className="size-2 shrink-0 rounded-full bg-red-500" />}
        </button>
      </aside>

      {view === "requests" ? (
        <RuleRequestsSection
          ruleRequests={visibleRuleRequests}
          isAdmin={isAdmin}
          onAddNew={onAddNew}
          onApproveRequest={onApproveRequest}
          onRejectRequest={onRejectRequest}
        />
      ) : (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto px-8 pt-[18px] pb-8">
          <div className="flex w-full items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Rule Types</h2>
              <p className="text-sm text-muted-foreground">
                Manage the data quality rule types available in Data Quality Experience. Custom rules are marked with a badge.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rule name or code..."
              className="h-10 pl-9"
            />
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <Accordion className="px-4">
              {filteredRules.map((rule) => {
                const numerator = rule.numerator ?? rule.num
                const denominator = rule.denominator ?? rule.denom
                const createdBy = rule.createdBy ?? (rule.custom ? "You" : "Indy")

                return (
                  <AccordionItem key={rule.key} value={rule.key} className="not-last:border-b border-neutral-200">
                    <AccordionTrigger className="rounded-lg px-2 py-4 hover:bg-muted/60 hover:no-underline">
                      <div className="flex w-full items-start justify-between gap-4 pr-2">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{rule.title}</p>
                              <Badge variant="outline" className="border-transparent bg-muted font-medium text-muted-foreground">
                                {rule.dimension}
                              </Badge>
                              {rule.custom && (
                                <Badge variant="outline" className="border-transparent bg-[#fdecee] text-primary">
                                  Custom
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm font-normal text-muted-foreground">{rule.description}</p>
                            {rule.custom && rule.updatedAt && (
                              <p className="mt-1 text-xs font-normal text-muted-foreground">Updated on {rule.updatedAt}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="mb-4 grid grid-cols-4 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm [&>*]:border-r [&>*]:border-neutral-200 [&>*:last-child]:border-r-0">
                        <FieldStat label="Numerator" value={numerator} />
                        <FieldStat label="Denominator" value={denominator} />
                        <FieldStat label="Rate" value={rule.rate} />
                        <FieldStat label="Created by" value={createdBy} />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(rule)}>
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleCopy(rule.template)}>
                          <Copy className="size-3.5" />
                          Copy
                        </Button>
                      </div>
                      <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs whitespace-pre text-neutral-700">
                        <SqlCodeBlock code={rule.template} />
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}

              {filteredRules.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No rules match your search.</p>
              )}
            </Accordion>
          </div>
        </div>
      )}
    </div>
  )
}
