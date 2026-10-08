import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const SEVERITY_CLASS = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-neutral-100 text-neutral-600",
}

function SeverityBadge({ value }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        SEVERITY_CLASS[value] ?? SEVERITY_CLASS.Low
      )}
    >
      {value}
    </span>
  )
}

// Fixed max width/height so wide, long result sets scroll inside the chat
// message instead of blowing out the page in either direction.
export default function DataQualityTable({ columns, rows }) {
  const severityIndex = columns.indexOf("Severity")

  return (
    <div className="max-h-[320px] w-full max-w-full overflow-auto rounded-lg border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="sticky top-0 z-10 bg-neutral-50">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri}>
              {row.map((cell, ci) => (
                <TableCell key={ci}>{ci === severityIndex ? <SeverityBadge value={cell} /> : cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
