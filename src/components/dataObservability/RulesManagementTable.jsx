import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Search, SlidersHorizontal, ArrowLeft, ArrowRight, Eye, Check, X, CirclePlus, CircleMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { getStandardRules } from "@/lib/dqComposer/ruleCatalog"
import { fullRulesManagementTableName, countRulesForRow } from "@/data/rulesManagementData"
import { useAccess } from "@/context/AccessContext"
import { useLocalStorageState } from "@/lib/useLocalStorageState"
import { requesterDisplayName, formatDateTime, RequestStatusBadge } from "@/lib/requestStatus"
import { cn } from "@/lib/utils"

// Display order for dimension columns/accordion sections — cosmetic only,
// independent of the dimension -> rule-type grouping in constants.js.
const DIMENSION_ORDER = ["Completeness", "Timeliness", "Validity", "Accuracy", "Uniqueness", "Consistency"]

// All dimension chips share one green nuance — count is what differentiates
// rows, not chip color.
const DIMENSION_CHIP_CLASS = "bg-emerald-50 text-emerald-700"

const CONFIGURATION_VIEWS = [
  { value: "all", label: "All configurations" },
  { value: "configured", label: "Configured only" },
  { value: "unconfigured", label: "Unconfigured only" },
]

const PAGE_SIZE = 25

function rulesForDimension(dimension) {
  return getStandardRules().filter((r) => r.dimension === dimension)
}

function sameRules(a, b) {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

function sameRulesByDimension(a, b) {
  return DIMENSION_ORDER.every((dim) => sameRules(a[dim] || [], b[dim] || []))
}

function DimensionCell({ count }) {
  if (!count) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", DIMENSION_CHIP_CLASS)}>
      {count} {count === 1 ? "rule" : "rules"}
    </Badge>
  )
}

function FilterSelect({ value, onValueChange, options, placeholder }) {
  const labelsByValue = Object.fromEntries(options.map((o) => [o.value, o.label]))
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 shadow-xs">
        <SelectValue placeholder={placeholder}>{(v) => labelsByValue[v] ?? placeholder}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Confirms a rules edit before it's sent off for admin review — collects the
// required note described in the change-request flow (step 3).
function ConfirmSubmitDialog({ open, onOpenChange, onConfirm }) {
  const [note, setNote] = useState("")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setNote("")
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit for approval</DialogTitle>
          <DialogDescription>
            These changes will be reviewed by an admin before they're applied. Add a note explaining the request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why are you requesting this change?"
            className="field-sizing-fixed h-24 resize-none text-sm"
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            type="button"
            disabled={!note.trim()}
            onClick={() => {
              onConfirm(note.trim())
              setNote("")
            }}
          >
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ManageRulesDrawer({ row, activeRequest, open, onOpenChange, onRequestChange }) {
  const [draft, setDraft] = useState(() => row?.rulesByDimension || {})
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isPending = activeRequest?.status === "pending"

  // Re-seed the draft whenever a different row is opened, or whenever a
  // pending request means edits are locked back to the "before" state.
  const [openRowId, setOpenRowId] = useState(row?.id)
  if (row && (row.id !== openRowId || (isPending && !sameRulesByDimension(draft, row.rulesByDimension)))) {
    setOpenRowId(row.id)
    setDraft(row.rulesByDimension)
  }

  if (!row) return null

  const hasChanges = !isPending && !sameRulesByDimension(draft, row.rulesByDimension)

  function toggleRule(dimension, ruleTitle, checked) {
    if (isPending) return
    setDraft((prev) => {
      const current = prev[dimension] || []
      const next = checked ? [...current, ruleTitle] : current.filter((r) => r !== ruleTitle)
      return { ...prev, [dimension]: next }
    })
  }

  function handleConfirmSubmit(note) {
    onRequestChange(row.id, draft, note)
    setConfirmOpen(false)
    onOpenChange(false)
  }

  const totalSelected = DIMENSION_ORDER.reduce((sum, dim) => sum + (draft[dim]?.length || 0), 0)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[450px] data-[side=right]:sm:max-w-[450px]">
          <SheetHeader className="border-b border-neutral-200">
            <SheetTitle className="pr-8">{fullRulesManagementTableName(row)}</SheetTitle>
            <SheetDescription>
              {row.connection} · {row.category} · {row.granularity} · {totalSelected} rules applied
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {isPending && (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                This table has a pending change request from {activeRequest.requestedBy}. Editing is locked until an
                admin reviews it.
              </p>
            )}

            <Accordion multiple className="flex flex-col gap-3">
              {DIMENSION_ORDER.map((dimension) => {
                const options = rulesForDimension(dimension)
                const selected = isPending
                  ? activeRequest.after[dimension] || []
                  : draft[dimension] || []
                const dimensionHasPending =
                  isPending &&
                  options.some(
                    (rule) =>
                      (activeRequest.after[dimension] || []).includes(rule.title) !==
                      (activeRequest.before[dimension] || []).includes(rule.title)
                  )

                return (
                  <AccordionItem
                    key={dimension}
                    value={dimension}
                    className="rounded-lg border border-neutral-200 bg-white"
                  >
                    <AccordionTrigger className="rounded-lg px-3 hover:bg-muted/60 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{dimension}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent font-medium",
                            dimensionHasPending ? "bg-amber-100 text-amber-700" : DIMENSION_CHIP_CLASS
                          )}
                        >
                          {selected.length}/{options.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3">
                      {options.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No rules available for this dimension yet.</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {options.map((rule) => {
                            const wasCheckedBefore = (activeRequest?.before[dimension] || []).includes(rule.title)
                            const isCheckedAfter = (activeRequest?.after[dimension] || []).includes(rule.title)
                            const isRulePending = isPending && wasCheckedBefore !== isCheckedAfter

                            return (
                              <label key={rule.key} className="group flex items-start gap-2.5">
                                <Checkbox
                                  className="mt-0.5"
                                  checked={selected.includes(rule.title)}
                                  disabled={isPending}
                                  onCheckedChange={(checked) => toggleRule(dimension, rule.title, Boolean(checked))}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{rule.title}</span>
                                    {isRulePending && (
                                      <Badge variant="outline" className="border-transparent bg-amber-100 text-amber-700">
                                        Pending
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="block text-sm text-muted-foreground">{rule.description}</span>
                                  {isRulePending && (
                                    <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5">
                                      {wasCheckedBefore ? (
                                        <CirclePlus className="size-4 text-emerald-500" />
                                      ) : (
                                        <CircleMinus className="size-4 text-red-500" />
                                      )}
                                      <ArrowRight className="size-3.5 text-muted-foreground" />
                                      {isCheckedAfter ? (
                                        <CirclePlus className="size-4 text-emerald-500" />
                                      ) : (
                                        <CircleMinus className="size-4 text-red-500" />
                                      )}
                                    </span>
                                  )}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>

          <SheetFooter className="flex-row justify-end border-t border-neutral-200">
            <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
            <Button type="button" disabled={!hasChanges} onClick={() => setConfirmOpen(true)}>
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmSubmitDialog open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={handleConfirmSubmit} />
    </>
  )
}

function DimensionDiffList({ dimension, before, after }) {
  const beforeSet = new Set(before[dimension] || [])
  const afterSet = new Set(after[dimension] || [])
  const added = [...afterSet].filter((r) => !beforeSet.has(r))
  const removed = [...beforeSet].filter((r) => !afterSet.has(r))

  if (added.length === 0 && removed.length === 0) return null

  const descriptionByTitle = Object.fromEntries(
    rulesForDimension(dimension).map((rule) => [rule.title, rule.description])
  )

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <p className="text-sm font-medium text-foreground">{dimension}</p>
      <div className="mt-1.5 flex flex-col gap-2">
        {added.map((title) => (
          <div key={`add-${title}`}>
            <p className="text-sm text-emerald-700">+ {title}</p>
            {descriptionByTitle[title] && (
              <p className="text-sm text-muted-foreground">{descriptionByTitle[title]}</p>
            )}
          </div>
        ))}
        {removed.map((title) => (
          <div key={`rem-${title}`}>
            <p className="text-sm text-red-600 line-through decoration-red-300">− {title}</p>
            {descriptionByTitle[title] && (
              <p className="text-sm text-muted-foreground">{descriptionByTitle[title]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewRequestDrawer({ row, request, isAdmin, open, onOpenChange, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")

  if (!row || !request) return null

  const hasDiff = DIMENSION_ORDER.some((dim) => {
    const before = new Set(request.before[dim] || [])
    const after = new Set(request.after[dim] || [])
    return before.size !== after.size || [...before].some((r) => !after.has(r)) || [...after].some((r) => !before.has(r))
  })

  function handleApprove() {
    onApprove(request.id)
    onOpenChange(false)
  }

  function handleConfirmReject() {
    onReject(request.id, reason.trim())
    setRejecting(false)
    setReason("")
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setRejecting(false)
          setReason("")
        }
        onOpenChange(next)
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px] data-[side=right]:sm:max-w-[480px]">
        <SheetHeader className="border-b border-neutral-200">
          <div className="flex items-center gap-2 pr-8">
            <SheetTitle>{fullRulesManagementTableName(row)}</SheetTitle>
            <RequestStatusBadge status={request.status} />
          </div>
          <SheetDescription>
            {row.connection} · {row.category} · {row.granularity}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Requested by</p>
              <p className="text-sm font-medium text-foreground">{request.requestedBy}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Requested at</p>
              <p className="text-sm font-medium text-foreground">{request.requestedAt}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Note from requester</p>
            <p className="mt-1 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-sm text-foreground">
              {request.note}
            </p>
          </div>

          {request.status === "rejected" && request.reviewNote && (
            <div>
              <p className="text-xs text-muted-foreground">Rejection reason</p>
              <p className="mt-1 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
                {request.reviewNote}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-foreground">Changes by dimension</p>
            <div className="mt-2 flex flex-col gap-2">
              {hasDiff ? (
                DIMENSION_ORDER.map((dim) => (
                  <DimensionDiffList key={dim} dimension={dim} before={request.before} after={request.after} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No differences found.</p>
              )}
            </div>
          </div>
        </div>

        {isAdmin && request.status === "pending" && (
          <SheetFooter className="border-t border-neutral-200">
            {rejecting ? (
              <div className="flex w-full flex-col gap-2">
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for rejecting (required)"
                  className="field-sizing-fixed h-20 resize-none text-sm"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setRejecting(false)}>
                    Back
                  </Button>
                  <Button type="button" variant="destructive" disabled={!reason.trim()} onClick={handleConfirmReject}>
                    Confirm Reject
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRejecting(true)}>
                  <X className="size-3.5" />
                  Reject
                </Button>
                <Button type="button" onClick={handleApprove}>
                  <Check className="size-3.5" />
                  Approve
                </Button>
              </div>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ChangeRequestsView({ rows, changeRequests, onBack, onReview }) {
  const requestRows = useMemo(() => {
    return [...changeRequests]
      .sort((a, b) => b.requestedAtMs - a.requestedAtMs)
      .map((request) => ({ request, row: rows.find((r) => r.id === request.rowId) }))
      .filter((entry) => entry.row)
  }, [changeRequests, rows])

  return (
    <div className="flex w-full flex-1 flex-col gap-6 overflow-y-auto px-8 pt-[18px] pb-8">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">Changes request</h2>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registered Table</TableHead>
              {DIMENSION_ORDER.map((dimension) => (
                <TableHead key={dimension}>{dimension}</TableHead>
              ))}
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requestRows.map(({ request, row }) => {
              const total = countRulesForRow(row)
              return (
                <TableRow key={request.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{fullRulesManagementTableName(row)}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.connection} · {row.category} · {row.granularity}
                    </p>
                  </TableCell>
                  {DIMENSION_ORDER.map((dimension) => (
                    <TableCell key={dimension}>
                      <DimensionCell count={row.rulesByDimension[dimension]?.length || 0} />
                    </TableCell>
                  ))}
                  <TableCell className="font-medium text-foreground">{total}</TableCell>
                  <TableCell>
                    <RequestStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell>
                    <Button type="button" size="sm" variant="outline" onClick={() => onReview(row.id)}>
                      <Eye className="size-3.5" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}

            {requestRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={DIMENSION_ORDER.length + 4} className="text-center text-sm text-muted-foreground">
                  No change requests yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function RulesManagementTable({ rows, onUpdateRow }) {
  const { role } = useAccess()
  const isAdmin = role !== "user"

  const [search, setSearch] = useState("")
  const [connectionFilter, setConnectionFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [configFilter, setConfigFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [manageRowId, setManageRowId] = useState(null)
  const [view, setView] = useState("table")
  const [reviewRowId, setReviewRowId] = useState(null)
  const [changeRequests, setChangeRequests] = useLocalStorageState("indy-rules-change-requests", [])

  const connectionOptions = useMemo(
    () => [
      { value: "all", label: "All connections" },
      ...[...new Set(rows.map((r) => r.connection))].map((c) => ({ value: c, label: c })),
    ],
    [rows]
  )

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...[...new Set(rows.map((r) => r.category))].map((c) => ({ value: c, label: c })),
    ],
    [rows]
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (connectionFilter !== "all" && row.connection !== connectionFilter) return false
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false

      const total = countRulesForRow(row)
      if (configFilter === "configured" && total === 0) return false
      if (configFilter === "unconfigured" && total > 0) return false

      if (!q) return true
      const fullName = fullRulesManagementTableName(row).toLowerCase()
      const ruleMatch = DIMENSION_ORDER.some((dim) =>
        (row.rulesByDimension[dim] || []).some((rule) => rule.toLowerCase().includes(q))
      )
      return (
        fullName.includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.connection.toLowerCase().includes(q) ||
        ruleMatch
      )
    })
  }, [rows, search, connectionFilter, categoryFilter, configFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function updateFilter(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  // Latest request per table — a row only ever has one "active" request at a
  // time; older ones stay in changeRequests for the audit list.
  const latestRequestByRowId = useMemo(() => {
    const map = {}
    for (const request of changeRequests) {
      const current = map[request.rowId]
      if (!current || request.requestedAtMs > current.requestedAtMs) map[request.rowId] = request
    }
    return map
  }, [changeRequests])

  const pendingCount = changeRequests.filter((r) => r.status === "pending").length

  const manageRow = rows.find((r) => r.id === manageRowId) || null
  const reviewRow = rows.find((r) => r.id === reviewRowId) || null
  const reviewRequest = reviewRowId ? latestRequestByRowId[reviewRowId] : null

  function handleRequestChange(rowId, draft, note) {
    const row = rows.find((r) => r.id === rowId)
    const now = new Date()
    const request = {
      id: `cr_${now.getTime().toString(36)}`,
      rowId,
      status: "pending",
      requestedBy: requesterDisplayName(role),
      requestedAt: formatDateTime(now),
      requestedAtMs: now.getTime(),
      note,
      before: row.rulesByDimension,
      after: draft,
    }
    setChangeRequests((prev) => [...prev, request])
    toast.success(`Change request submitted for ${fullRulesManagementTableName(row)}`)
  }

  function handleApproveRequest(requestId) {
    setChangeRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r))
    )
    const request = changeRequests.find((r) => r.id === requestId)
    if (request) {
      onUpdateRow(request.rowId, { rulesByDimension: request.after })
      toast.success("Change request approved and applied")
    }
  }

  function handleRejectRequest(requestId, reason) {
    setChangeRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "rejected", reviewNote: reason } : r))
    )
    toast("Change request rejected", { description: "The requester can see the reason and resubmit." })
  }

  if (view === "requests") {
    return (
      <>
        <ChangeRequestsView
          rows={rows}
          changeRequests={changeRequests}
          onBack={() => setView("table")}
          onReview={(rowId) => setReviewRowId(rowId)}
        />
        <ReviewRequestDrawer
          row={reviewRow}
          request={reviewRequest}
          isAdmin={isAdmin}
          open={Boolean(reviewRow && reviewRequest)}
          onOpenChange={(open) => !open && setReviewRowId(null)}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      </>
    )
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-6 overflow-y-auto px-8 pt-[18px] pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Rules Management</h2>
          <p className="text-sm text-muted-foreground">
            One row per registered table. Select a dimension count or Manage to edit its assigned rules.{" "}
            <Badge variant="outline" className="border-transparent bg-muted font-medium text-muted-foreground">
              {rows.length} registered tables
            </Badge>
          </p>
        </div>
        <div className="relative shrink-0">
          <Button type="button" variant="outline" onClick={() => setView("requests")}>
            Changes request
          </Button>
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-64 shrink-0">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search schema or table..."
            className="h-9 pl-8 text-sm"
          />
        </div>
        <FilterSelect
          value={connectionFilter}
          onValueChange={updateFilter(setConnectionFilter)}
          options={connectionOptions}
          placeholder="All connections"
        />
        <FilterSelect
          value={categoryFilter}
          onValueChange={updateFilter(setCategoryFilter)}
          options={categoryOptions}
          placeholder="All categories"
        />
        <FilterSelect
          value={configFilter}
          onValueChange={updateFilter(setConfigFilter)}
          options={CONFIGURATION_VIEWS}
          placeholder="All configurations"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registered Table</TableHead>
              {DIMENSION_ORDER.map((dimension) => (
                <TableHead key={dimension}>{dimension}</TableHead>
              ))}
              <TableHead>Total</TableHead>
              <TableHead className="w-28">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => {
              const total = countRulesForRow(row)
              const request = latestRequestByRowId[row.id]
              const isRowPending = request?.status === "pending"
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{fullRulesManagementTableName(row)}</p>
                      {isRowPending && <RequestStatusBadge status="pending" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {row.connection} · {row.category} · {row.granularity}
                    </p>
                  </TableCell>
                  {DIMENSION_ORDER.map((dimension) => (
                    <TableCell key={dimension}>
                      <DimensionCell count={row.rulesByDimension[dimension]?.length || 0} />
                    </TableCell>
                  ))}
                  <TableCell className="font-medium text-foreground">{total}</TableCell>
                  <TableCell>
                    <Button type="button" size="sm" variant="outline" onClick={() => setManageRowId(row.id)}>
                      <SlidersHorizontal className="size-3.5" />
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}

            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={DIMENSION_ORDER.length + 3} className="text-center text-sm text-muted-foreground">
                  No tables match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredRows.length > 0 && (
        <Pagination className="justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of{" "}
            {filteredRows.length} tables
          </p>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.max(1, p - 1))
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === currentPage}
                  onClick={(e) => {
                    e.preventDefault()
                    setPage(p)
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.min(totalPages, p + 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <ManageRulesDrawer
        row={manageRow}
        activeRequest={manageRowId ? latestRequestByRowId[manageRowId] : null}
        open={Boolean(manageRow)}
        onOpenChange={(open) => !open && setManageRowId(null)}
        onRequestChange={handleRequestChange}
      />
    </div>
  )
}
