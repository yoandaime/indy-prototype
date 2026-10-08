import { useEffect, useRef, useState } from "react"
import { ImageUp, Pencil, Plus, Server, ShieldCheck, Table2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import IconCombobox from "@/components/ticketing/IconCombobox"
import FieldLabel from "@/components/ticketing/FieldLabel"
import {
  HOST_OPTIONS,
  ISSUE_GRANULARITY_OPTIONS,
  ISSUE_PRIORITY_OPTIONS,
  PRIORITY_DESCRIPTIONS,
  TABLE_NAME_SUGGESTIONS,
} from "@/data/ticketingData"

const MAX_ISSUES = 5

// Falls back to "Issue N" until the reporter gives it a custom title.
function issueLabel(issue, index) {
  return issue.title?.trim() || `Issue ${index + 1}`
}

// True once this issue is missing any of its required fields — used to drive
// the red "required" styling after a submit attempt.
function isIssueIncomplete(issue) {
  return (
    !issue.ipAddress.trim() ||
    !issue.tableName.trim() ||
    !issue.from ||
    !issue.to ||
    !issue.priority ||
    !issue.description.trim()
  )
}

// Each issue is now a self-contained sub-ticket: its own host/table/period,
// priority, description, screenshots (multiple allowed) and "raise on behalf
// of" — edited one at a time via tabs instead of all stacked as separate
// cards. Used by the New Ticket dialog only; UpdateTicketDialog keeps the
// simpler IssueRowsEditor since priority/description aren't editable there.
export default function IssueTabsEditor({
  issues,
  onUpdateIssue,
  onAddIssue,
  onRemoveIssue,
  max = MAX_ISSUES,
  attemptedSubmit = false,
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [editingTitleId, setEditingTitleId] = useState(null)
  const fileInputRefs = useRef({})

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, issues.length - 1))
  }, [issues.length])

  const handleAdd = () => {
    if (issues.length >= max) return
    onAddIssue()
    setActiveIndex(issues.length)
  }

  const handleRemove = (id, index) => {
    onRemoveIssue(id)
    setActiveIndex((i) => (i >= index ? Math.max(0, i - 1) : i))
  }

  const addImageFiles = (issue, files) => {
    const images = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"))
    if (images.length === 0) return
    const added = images.map((file) => ({ name: file.name || "pasted-image.png", url: URL.createObjectURL(file) }))
    onUpdateIssue(issue.id, { screenshots: [...issue.screenshots, ...added] })
  }

  const removeImage = (issue, index) => {
    onUpdateIssue(issue.id, { screenshots: issue.screenshots.filter((_, i) => i !== index) })
  }

  const handleDescriptionPaste = (issue) => (e) => {
    const item = Array.from(e.clipboardData?.items ?? []).find((it) => it.type.startsWith("image/"))
    if (!item) return
    e.preventDefault()
    addImageFiles(issue, [item.getAsFile()])
  }

  const handleDrop = (issue) => (e) => {
    e.preventDefault()
    addImageFiles(issue, e.dataTransfer.files)
  }

  const handleImagePick = (issue) => (e) => {
    addImageFiles(issue, e.target.files)
    e.target.value = ""
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <FieldLabel required className="text-sm font-semibold text-foreground">
            Issues
          </FieldLabel>
          <p className="text-xs text-muted-foreground">
            Each tab is one concrete problem — its own period, priority and description. {issues.length}/{max} added.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={issues.length >= max} className="shrink-0">
          <Plus className="size-4" />
          Add issue
        </Button>
      </div>

      <Tabs value={String(activeIndex)} onValueChange={(v) => setActiveIndex(Number(v))} className="w-full">
        <TabsList className="max-w-full overflow-x-auto">
          {issues.map((issue, index) => (
            <TabsTrigger key={issue.id} value={String(index)} className="shrink-0 gap-1.5">
              {issueLabel(issue, index)}
              {attemptedSubmit && isIssueIncomplete(issue) && (
                <span className="size-1.5 shrink-0 rounded-full bg-destructive" aria-label="Missing required fields" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {issues.map((issue, index) => (
          <TabsContent
            key={issue.id}
            value={String(index)}
            className="w-full space-y-4 rounded-lg border border-neutral-200 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              {editingTitleId === issue.id ? (
                <Input
                  autoFocus
                  value={issue.title}
                  onChange={(e) => onUpdateIssue(issue.id, { title: e.target.value })}
                  onBlur={() => setEditingTitleId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") setEditingTitleId(null)
                  }}
                  placeholder={`Issue ${index + 1}`}
                  className="h-7 max-w-[240px] text-sm font-semibold shadow-xs"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingTitleId(issue.id)}
                  className="group flex min-w-0 items-center gap-1.5"
                >
                  <span className="truncate text-sm font-semibold text-foreground">
                    {issueLabel(issue, index)}
                  </span>
                  <Pencil className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                </button>
              )}

              {issues.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(issue.id, index)}
                >
                  <Trash2 className="size-4" />
                  Remove this issue
                </Button>
              )}
            </div>

            <div className="flex items-start gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <FieldLabel htmlFor={`issue-ip-${issue.id}`} required className="text-xs font-medium text-foreground">
                  IP Address
                </FieldLabel>
                <IconCombobox
                  id={`issue-ip-${issue.id}`}
                  icon={Server}
                  value={issue.ipAddress}
                  onValueChange={(value) => onUpdateIssue(issue.id, { ipAddress: value })}
                  options={HOST_OPTIONS}
                  placeholder="Select a host..."
                  emptyText="No matching host."
                  invalid={attemptedSubmit && !issue.ipAddress.trim()}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <FieldLabel htmlFor={`issue-table-${issue.id}`} required className="text-xs font-medium text-foreground">
                  Table Name
                </FieldLabel>
                <IconCombobox
                  id={`issue-table-${issue.id}`}
                  icon={Table2}
                  value={issue.tableName}
                  onValueChange={(value) => onUpdateIssue(issue.id, { tableName: value })}
                  options={TABLE_NAME_SUGGESTIONS}
                  placeholder="e.g. ran_cell_day_4g"
                  emptyText="No matching table."
                  invalid={attemptedSubmit && !issue.tableName.trim()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Problem Period</Label>
              <div className="flex items-start gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FieldLabel htmlFor={`issue-granularity-${issue.id}`} className="text-xs font-medium text-foreground">
                    Granularity
                  </FieldLabel>
                  <Select
                    value={issue.granularity}
                    onValueChange={(value) => onUpdateIssue(issue.id, { granularity: value })}
                  >
                    <SelectTrigger id={`issue-granularity-${issue.id}`} className="h-9 w-full shadow-xs">
                      <SelectValue placeholder="Select" className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {ISSUE_GRANULARITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FieldLabel htmlFor={`issue-from-${issue.id}`} required className="text-xs font-medium text-foreground">
                    From
                  </FieldLabel>
                  <Input
                    id={`issue-from-${issue.id}`}
                    type="date"
                    value={issue.from}
                    onChange={(e) => onUpdateIssue(issue.id, { from: e.target.value })}
                    aria-invalid={(attemptedSubmit && !issue.from) || undefined}
                    className="h-9 shadow-xs"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FieldLabel htmlFor={`issue-to-${issue.id}`} required className="text-xs font-medium text-foreground">
                    To
                  </FieldLabel>
                  <Input
                    id={`issue-to-${issue.id}`}
                    type="date"
                    value={issue.to}
                    onChange={(e) => onUpdateIssue(issue.id, { to: e.target.value })}
                    aria-invalid={(attemptedSubmit && !issue.to) || undefined}
                    className="h-9 shadow-xs"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Format YYYY-MM-DD</p>
            </div>

            <div className="space-y-1">
              <FieldLabel htmlFor={`issue-priority-${issue.id}`} required className="text-xs font-medium text-foreground">
                Priority
              </FieldLabel>
              <Select value={issue.priority} onValueChange={(value) => onUpdateIssue(issue.id, { priority: value })}>
                <SelectTrigger
                  id={`issue-priority-${issue.id}`}
                  aria-invalid={(attemptedSubmit && !issue.priority) || undefined}
                  className="h-9 w-full shadow-xs"
                >
                  <SelectValue placeholder="Select priority" className="truncate">
                    {(value) => (value ? PRIORITY_DESCRIPTIONS[value] : "Select priority")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {PRIORITY_DESCRIPTIONS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <FieldLabel htmlFor={`issue-description-${issue.id}`} required className="text-xs font-medium text-foreground">
                Detailed Data Issue Description
              </FieldLabel>
              <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop(issue)} className="space-y-2">
                <Textarea
                  id={`issue-description-${issue.id}`}
                  placeholder="What is wrong, which partition or period it affects, and what you already checked. Paste a screenshot to attach it."
                  value={issue.description}
                  onChange={(e) => onUpdateIssue(issue.id, { description: e.target.value })}
                  onPaste={handleDescriptionPaste(issue)}
                  aria-invalid={(attemptedSubmit && !issue.description.trim()) || undefined}
                  className="min-h-[73px] shadow-xs"
                />
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    ref={(el) => (fileInputRefs.current[issue.id] = el)}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagePick(issue)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRefs.current[issue.id]?.click()}
                  >
                    <ImageUp className="size-4" />
                    Attach screenshot
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Drop files here, or paste a screenshot into the description. Multiple images allowed.
                  </span>
                </div>
                {issue.screenshots.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {issue.screenshots.map((shot, shotIndex) => (
                      <div key={shot.url} className="group relative size-[60px] shrink-0">
                        <img src={shot.url} alt={shot.name} className="size-[60px] rounded-md border object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(issue, shotIndex)}
                          aria-label={`Remove ${shot.name}`}
                          className="absolute -top-1.5 -right-1.5 flex size-4.5 items-center justify-center rounded-full bg-neutral-900 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-dashed border-neutral-300 p-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Raise on behalf of</span>
                <span className="text-xs text-muted-foreground">— admin only, optional</span>
              </div>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={issue.onBehalfEmail}
                onChange={(e) => onUpdateIssue(issue.id, { onBehalfEmail: e.target.value })}
                className="h-9 shadow-xs"
              />
              <p className="text-xs text-muted-foreground">
                You stay the reporter; they are recorded as whose problem this issue is.
              </p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
