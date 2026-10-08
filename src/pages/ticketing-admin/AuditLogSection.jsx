import { Database } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

const AUDIT_LOGS = []

export default function AuditLogSection() {
  return (
    <div className="w-full flex-1 space-y-4.5 bg-white p-8">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-muted-foreground" />
              <div>
                <h1 className="text-sm font-semibold text-foreground">
                  Activity Tracking &amp; Form Audit Log (SQLite DB)
                </h1>
                <p className="text-xs text-muted-foreground">
                  Records all form activity: logins, ticket creation &amp; close events.
                </p>
              </div>
              <Badge variant="secondary">ndq_forum.db</Badge>
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total: {AUDIT_LOGS.length} Log</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <Table>
              <TableHeader>
                <TableRow className="h-9 border-neutral-200 bg-neutral-100 hover:bg-neutral-100">
                  <TableHead className="text-sm font-medium text-neutral-600">Timestamp</TableHead>
                  <TableHead className="text-sm font-medium text-neutral-600">Action Type</TableHead>
                  <TableHead className="text-sm font-medium text-neutral-600">User</TableHead>
                  <TableHead className="text-sm font-medium text-neutral-600">Form Activity Details</TableHead>
                  <TableHead className="text-sm font-medium text-neutral-600">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AUDIT_LOGS.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No activity logs found in database.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
