import { Plus, Server, Table2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import IconCombobox from "@/components/ticketing/IconCombobox"
import FieldLabel from "@/components/ticketing/FieldLabel"
import { HOST_OPTIONS, ISSUE_GRANULARITY_OPTIONS, TABLE_NAME_SUGGESTIONS } from "@/data/ticketingData"

const MAX_ISSUES = 5

// Editable "Issues" section shared by the New, Duplicate and Update ticket
// dialogs — each row is one concrete problem (host, table, problem period).
export default function IssueRowsEditor({ issues, onUpdateIssue, onAddIssue, onRemoveIssue, max = MAX_ISSUES }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <FieldLabel required className="text-sm font-semibold text-foreground">
            Issues
          </FieldLabel>
          <p className="text-xs text-muted-foreground">
            Each row is one concrete problem — its own period, host and tables. {issues.length}/{max} added.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddIssue}
          disabled={issues.length >= max}
          className="shrink-0"
        >
          <Plus className="size-4" />
          Add issue
        </Button>
      </div>

      <div className="space-y-4">
        {issues.map((issue, index) => (
          <div key={issue.id} className="space-y-4 rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Issue {index + 1}</span>
              {issues.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveIssue(issue.id)}
                >
                  <Trash2 className="size-4" />
                  Remove
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
                    className="h-9 shadow-xs"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Format YYYY-MM-DD</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
