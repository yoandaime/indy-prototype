import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import IssueTabsEditor from "@/components/ticketing/IssueTabsEditor"
import FieldLabel from "@/components/ticketing/FieldLabel"
import { Copy } from "lucide-react"
import {
  APPLICATION_OPTIONS,
  CONCERN_OPTIONS,
  CURRENT_USER,
  DOMAIN_OPTIONS,
  DOMAIN_TABLE_NAMES,
  ISSUE_PRIORITY_OPTIONS,
  SCOPE_OPTIONS,
  TICKET_KIND_OPTIONS,
  getTicketIssues,
} from "@/data/ticketingData"
import { DEFAULT_CATEGORIES } from "@/data/picCategoryData"

const CATEGORY_OPTIONS = DEFAULT_CATEGORIES.map((c) => c.name)
const MAX_ISSUES = 5

// Lower index = more severe (P0 beats P1 beats P2) — used to pick which
// issue's priority/description represent the ticket as a whole.
const PRIORITY_RANK = Object.fromEntries(ISSUE_PRIORITY_OPTIONS.map((p, i) => [p, i]))

function pickPrimaryIssue(issues) {
  return issues.reduce((best, issue) => {
    const bestRank = PRIORITY_RANK[best.priority] ?? Infinity
    const issueRank = PRIORITY_RANK[issue.priority] ?? Infinity
    return issueRank < bestRank ? issue : best
  }, issues[0])
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function makeEmptyIssue() {
  return {
    id: `issue-${Math.random().toString(36).slice(2, 10)}`,
    title: "",
    ipAddress: "",
    tableName: "",
    granularity: "Daily",
    from: "",
    to: "",
    priority: "",
    description: "",
    onBehalfEmail: "",
    screenshots: [],
  }
}

const EMPTY_FORM = {
  kind: "",
  application: "",
  category: "",
  domain: "",
  domainCustom: false,
  tableNameOther: "",
  scope: "",
  concern: "",
}

function seedFormFromTicket(ticket) {
  return {
    kind: ticket.kind ?? "Kendala",
    application: ticket.category?.application ?? "",
    category: ticket.picCategory ?? "",
    domain: ticket.domain ?? "",
    domainCustom: !DOMAIN_TABLE_NAMES[ticket.domain],
    tableNameOther: "",
    scope: ticket.category?.scope ?? "",
    concern: ticket.category?.concern ?? "",
  }
}

// Older tickets only carry one shared priority/description/screenshot — used
// here as the seeded default for every duplicated issue tab.
function seedIssuesFromTicket(ticket) {
  return getTicketIssues(ticket).map((issue) => ({
    ...issue,
    id: `issue-${Math.random().toString(36).slice(2, 10)}`,
    title: issue.title ?? "",
    priority: issue.priority ?? ticket.priority ?? "",
    description: issue.description ?? ticket.description ?? "",
    onBehalfEmail: issue.onBehalfEmail ?? "",
    screenshots:
      issue.screenshots ?? (issue.screenshot ? [issue.screenshot] : ticket.screenshot ? [{ name: "Attachment", url: ticket.screenshot }] : []),
  }))
}

function CategorySelect({ id, label, value, onValueChange, options, disabled, placeholder, required = true, invalid }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <FieldLabel htmlFor={id} required={required} className="text-xs font-medium text-foreground">
        {label}
      </FieldLabel>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} aria-invalid={invalid || undefined} className="h-9 w-full shadow-xs">
          <SelectValue placeholder={placeholder} className="truncate" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function NewTicketDialog({ open, onOpenChange, onCreate, mode = "create", sourceTicket = null }) {
  const isDuplicate = mode === "duplicate"
  const [form, setForm] = useState(EMPTY_FORM)
  const [issues, setIssues] = useState([makeEmptyIssue()])
  const [error, setError] = useState("")
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  useEffect(() => {
    if (open && isDuplicate && sourceTicket) {
      setForm(seedFormFromTicket(sourceTicket))
      setIssues(seedIssuesFromTicket(sourceTicket))
      setError("")
      setAttemptedSubmit(false)
    }
  }, [open, isDuplicate, sourceTicket])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleApplicationChange = (value) => {
    setForm((f) => ({ ...f, application: value, category: "" }))
  }

  const handleScopeChange = (value) => {
    setForm((f) => ({ ...f, scope: value, concern: "" }))
  }

  const handleDomainChange = (value) => {
    if (value === "Other") {
      setForm((f) => ({ ...f, domain: "", domainCustom: true, tableNameOther: "" }))
      return
    }
    setForm((f) => ({
      ...f,
      domain: value,
      domainCustom: !DOMAIN_TABLE_NAMES[value],
      tableNameOther: "",
    }))
  }

  const isCustomDomain = form.domainCustom

  const updateIssue = (id, patch) => {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)))
  }

  const addIssue = () => {
    setIssues((prev) => (prev.length >= MAX_ISSUES ? prev : [...prev, makeEmptyIssue()]))
  }

  const removeIssue = (id) => {
    setIssues((prev) => (prev.length <= 1 ? prev : prev.filter((issue) => issue.id !== id)))
  }

  const reset = () => {
    setForm(EMPTY_FORM)
    setIssues([makeEmptyIssue()])
    setError("")
    setAttemptedSubmit(false)
  }

  const handleOpenChange = (next) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = () => {
    const domainValue = form.domain.trim()
    const issuesValid = issues.every(
      (issue) =>
        issue.ipAddress.trim() &&
        issue.tableName.trim() &&
        issue.granularity &&
        issue.from &&
        issue.to &&
        issue.priority &&
        issue.description.trim()
    )
    if (
      !form.kind.trim() ||
      !form.application.trim() ||
      !form.category.trim() ||
      !domainValue ||
      !form.scope.trim() ||
      !issuesValid
    ) {
      setAttemptedSubmit(true)
      setError("All required fields must be filled in before opening the ticket.")
      return
    }

    // The ticket as a whole is represented by its most severe issue — that
    // issue's priority drives the ticket's SLA clock, and its description
    // becomes the card/detail-page heading.
    const primaryIssue = pickPrimaryIssue(issues)
    const onBehalfEmail = primaryIssue.onBehalfEmail.trim()
    const ticketFor = onBehalfEmail ? "other" : "self"
    const issueOwner = onBehalfEmail || CURRENT_USER
    const description = primaryIssue.description.trim()

    onCreate({
      kind: form.kind,
      category: {
        application: form.application.trim(),
        scope: form.scope.trim(),
        concern: form.concern.trim(),
      },
      picCategory: form.category.trim(),
      domain: domainValue,
      tableName: primaryIssue.tableName,
      ticketFor,
      issueOwner,
      // The ticket's single heading is the reporter's own description — not
      // an auto-generated "concern — table" slug — so the card and detail
      // page show exactly what was typed in Detailed Data Issue Description.
      title: description,
      ipAddress: primaryIssue.ipAddress,
      description,
      priority: primaryIssue.priority,
      tags: [form.kind, form.category, domainValue].filter(Boolean).map(slugify),
      issues,
      screenshot: primaryIssue.screenshots[0]?.url ?? null,
    })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-6 sm:max-w-3xl">
        <DialogHeader className="gap-px">
          <DialogTitle className="text-xl leading-6 font-semibold">
            {isDuplicate ? "Duplicate Issue Ticket" : "Create New Issue Ticket"}
          </DialogTitle>
          <DialogDescription>
            {isDuplicate
              ? "Everything is copied from the original — change what differs, then submit."
              : "Describe what is wrong with the data, or what you need built."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isDuplicate && sourceTicket && (
            <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-700">
              <Copy className="mt-0.5 size-4 shrink-0" />
              <p>
                Copied from <span className="font-semibold">{sourceTicket.id}</span>. This creates a separate
                ticket — the original is untouched.
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">Issue Category</Label>
            <div className="flex items-start gap-4">
              <CategorySelect
                id="ticket-kind"
                label="Type"
                placeholder="Select"
                value={form.kind}
                onValueChange={(value) => setForm((f) => ({ ...f, kind: value }))}
                options={TICKET_KIND_OPTIONS}
                invalid={attemptedSubmit && !form.kind.trim()}
              />
              <CategorySelect
                id="ticket-app"
                label="Application"
                placeholder="Select"
                value={form.application}
                onValueChange={handleApplicationChange}
                options={APPLICATION_OPTIONS}
                invalid={attemptedSubmit && !form.application.trim()}
              />
              <CategorySelect
                id="ticket-category"
                label="Category"
                placeholder="Select"
                value={form.category}
                onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
                options={CATEGORY_OPTIONS}
                disabled={!form.application}
                invalid={attemptedSubmit && !form.category.trim()}
              />
            </div>

            <div className="flex items-start gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <FieldLabel htmlFor="ticket-domain" required className="text-xs font-medium text-foreground">
                  Domain
                </FieldLabel>
                {isCustomDomain ? (
                  <Input
                    id="ticket-domain"
                    placeholder="Type domain name..."
                    value={form.domain}
                    onChange={set("domain")}
                    aria-invalid={(attemptedSubmit && !form.domain.trim()) || undefined}
                    className="h-9 shadow-xs"
                  />
                ) : (
                  <Select value={form.domain} onValueChange={handleDomainChange}>
                    <SelectTrigger
                      id="ticket-domain"
                      aria-invalid={(attemptedSubmit && !form.domain.trim()) || undefined}
                      className="h-9 w-full shadow-xs"
                    >
                      <SelectValue placeholder="Select" className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {form.kind && (
                  <p className="text-xs text-muted-foreground">Accepting {form.kind}</p>
                )}
              </div>
              <CategorySelect
                id="ticket-scope"
                label="Scope"
                placeholder="Select"
                value={form.scope}
                onValueChange={handleScopeChange}
                options={SCOPE_OPTIONS}
                invalid={attemptedSubmit && !form.scope.trim()}
              />
              <CategorySelect
                id="ticket-concern"
                label="Concern"
                placeholder="Select"
                value={form.concern}
                onValueChange={(value) => setForm((f) => ({ ...f, concern: value }))}
                options={CONCERN_OPTIONS}
                disabled={!form.scope}
                required={false}
              />
            </div>
          </div>

          <IssueTabsEditor
            issues={issues}
            onUpdateIssue={updateIssue}
            onAddIssue={addIssue}
            onRemoveIssue={removeIssue}
            max={MAX_ISSUES}
            attemptedSubmit={attemptedSubmit}
          />

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-start justify-end gap-3">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{isDuplicate ? "Create Duplicate Ticket" : "Open Issue Ticket"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
