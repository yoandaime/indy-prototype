import { CircleAlert, Play, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import SqlEditor from "@/components/dataObservability/SqlEditor"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

function StatusPill({ status }) {
  const pass = status === "PASS"
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-semibold", pass ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}
    >
      {status}
    </Badge>
  )
}

export default function ComposerResults({ sqlQuery, onSqlQueryChange, columnMode, previewRows, onRunAnalysis, onOpenSave }) {
  if (!sqlQuery) {
    return (
      <div className="flex h-64 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-200 text-sm text-muted-foreground">
        <CircleAlert className="size-4" />
        Fill in the formula fields, then Generate SQL.
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="composer-sql">Generated SQL</Label>
        <SqlEditor
          id="composer-sql"
          value={sqlQuery}
          onChange={(e) => onSqlQueryChange(e.target.value)}
          className="h-64"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" onClick={onRunAnalysis}>
          <Play className="size-4" />
          Run Analysis
        </Button>
        <Button type="button" variant="outline" onClick={onOpenSave}>
          <Save className="size-4" />
          Save Rules
        </Button>
      </div>

      {previewRows && (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>table_name</TableHead>
                {columnMode === "multiple" && <TableHead>control_table</TableHead>}
                <TableHead>period</TableHead>
                <TableHead>rule_name</TableHead>
                <TableHead>numerator</TableHead>
                <TableHead>denominator</TableHead>
                <TableHead>rate_pct</TableHead>
                <TableHead>status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.table_name}</TableCell>
                  {columnMode === "multiple" && <TableCell>{row.control_table}</TableCell>}
                  <TableCell>{row.period}</TableCell>
                  <TableCell>{row.rule_name}</TableCell>
                  <TableCell>{row.numerator}</TableCell>
                  <TableCell>{row.denominator ?? <span className="text-muted-foreground">null</span>}</TableCell>
                  <TableCell>{row.rate_pct ?? <span className="text-muted-foreground">null</span>}</TableCell>
                  <TableCell>
                    <StatusPill status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
