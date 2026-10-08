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
import FieldLabel from "@/components/ticketing/FieldLabel"
import IssueRowsEditor from "@/components/ticketing/IssueRowsEditor"
import {
  CONCERN_OPTIONS,
  DOMAIN_OPTIONS,
  SCOPE_OPTIONS,
  getTicketIssues,
} from "@/data/ticketingData"
import { LEVEL_META } from "@/data/picCategoryData"

const MAX_ISSUES = 5

function makeIssueId() {
  return `issue-${Math.random().toString(36).slice(2, 10)}`
}

function makeEmptyIssue() {
  return { id: makeIssueId(), ipAddress: "", tableName: "", granularity: "Daily", from: "", to: "" }
}

function seedFromTicket(ticket) {
  return {
    picCategory: ticket.picCategory ?? "",
    domain: ticket.domain ?? "",
    scope: ticket.category?.scope ?? "",
    concern: ticket.category?.concern ?? "",
    level: ticket.level ?? "L0",
  }
}

// Edits a ticket's Issue Category, Issues and Level in place — status/priority
// changes go through the ticket's action buttons instead (Resume, Put on
// hold, Mark as solved, Submit Close & Archive).
export default function UpdateTicketDialog({ open, onOpenChange, ticket, categoryOptions, onSubmit }) {
  const [form, setForm] = useState(null)
  const [issues, setIssues] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && ticket) {
      setForm(seedFromTicket(ticket))
      setIssues(getTicketIssues(ticket).map((issue) => ({ ...issue, id: makeIssueId() })))
      setError("")
    }
  }, [open, ticket])

  const updateIssue = (id, patch) => {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)))
  }
  const addIssue = () => {
    setIssues((prev) => (prev.length >= MAX_ISSUES ? prev : [...prev, makeEmptyIssue()]))
  }
  const removeIssue = (id) => {
    setIssues((prev) => (prev.length <= 1 ? prev : prev.filter((issue) => issue.id !== id)))
  }

  const handleScopeChange = (value) => setForm((f) => ({ ...f, scope: value, concern: "" }))

  const handleSubmit = () => {
    if (!form) return
    const issuesValid = issues.every(
      (issue) => issue.ipAddress.trim() && issue.tableName.trim() && issue.granularity && issue.from && issue.to
    )
    if (!form.picCategory.trim() || !form.domain.trim() || !form.scope.trim() || !issuesValid) {
      setError("All required fields must be filled in before saving.")
      return
    }

    const primaryIssue = issues[0]
    onSubmit({
      picCategory: form.picCategory.trim(),
      domain: form.domain.trim(),
      category: { ...ticket.category, scope: form.scope.trim(), concern: form.concern.trim() },
      tableName: primaryIssue.tableName,
      ipAddress: primaryIssue.ipAddress,
      issues,
      level: form.level,
    })
    onOpenChange(false)
  }

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 sm:max-w-3xl">
        <DialogHeader className="gap-px">
          <DialogTitle className="text-xl leading-6 font-semibold">Update Issue Ticket</DialogTitle>
          <DialogDescription>
            Every change is recorded in the history log. Status is changed from the ticket actions, not here.
          </DialogDescription>
        </DialogHeader>

        {form && (
          <div className="space-y-6">
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-foreground">Issue Category</Label>
              <div className="flex items-start gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FieldLabel className="text-xs font-medium text-foreground">Type</FieldLabel>
                  <Input value={ticket.kind ?? "Kendala"} disabled className="h-9 shadow-xs" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FieldLabel className="text-xs font-medium text-foreground">Application</FieldLabel>
                  <Input value={ticket.category?.application ?? ""} disabled className="h-9 shadow-xs" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FieldLabel required className="text-xs font-medium text-foreground">
                    Category
                  </FieldLabel>
                  <Select
                    value={form.picCategory}
                    onValueChange={(value) => setForm((f) => ({ ...f, picCategory: value }))}
                  >
                    <SelectTrigger className="h-9 w-full shadow-xs">
                      <SelectValue placeholder="Select" className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FieldLabel required className="text-xs font-medium text-foreground">
                    Domain
                  </FieldLabel>
                  <Select value={form.domain} onValueChange={(value) => setForm((f) => ({ ...f, domain: value }))}>
                    <SelectTrigger className="h-9 w-full shadow-xs">
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
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FieldLabel required className="text-xs font-medium text-foreground">
                    Scope
                  </FieldLabel>
                  <Select value={form.scope} onValueChange={handleScopeChange}>
                    <SelectTrigger className="h-9 w-full shadow-xs">
                      <SelectValue placeholder="Select" className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCOPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FieldLabel className="text-xs font-medium text-foreground">Concern</FieldLabel>
                  <Select
                    value={form.concern}
                    onValueChange={(value) => setForm((f) => ({ ...f, concern: value }))}
                    disabled={!form.scope}
                  >
                    <SelectTrigger className="h-9 w-full shadow-xs">
                      <SelectValue placeholder="Select" className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONCERN_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <IssueRowsEditor
              issues={issues}
              onUpdateIssue={updateIssue}
              onAddIssue={addIssue}
              onRemoveIssue={removeIssue}
              max={MAX_ISSUES}
            />

            <div className="space-y-1">
              <FieldLabel required className="text-sm font-medium text-foreground">
                Level
              </FieldLabel>
              <Select value={form.level} onValueChange={(value) => setForm((f) => ({ ...f, level: value }))}>
                <SelectTrigger className="h-9 w-full shadow-xs">
                  <SelectValue placeholder="Select" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_META.map((level) => (
                    <SelectItem key={level.key} value={level.label}>
                      {level.label} — {level.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Raising the level escalates this ticket to that tier's PICs.
              </p>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex items-start justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save Changes</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
