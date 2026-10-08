import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FLOW_PROCESS_ENTRIES } from "@/data/flowProcessData"

export default function FlowProcessSection() {
  const navigate = useNavigate()

  return (
    <div className="h-full min-w-0 flex-1 space-y-6 overflow-y-auto bg-white px-10 pt-6 pb-10">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl leading-6 font-semibold text-foreground">Flow Process</h2>
        <Button>
          <Plus className="size-4" />
          New Data
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead>Category Data</TableHead>
              <TableHead>Layer</TableHead>
              <TableHead>Data Source</TableHead>
              <TableHead>Master Data</TableHead>
              <TableHead>Reference Data</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FLOW_PROCESS_ENTRIES.map((entry) => (
              <TableRow
                key={entry.id}
                className="cursor-pointer"
                onClick={() => navigate(`/catalog-knowledge/flow-process/${entry.id}`)}
              >
                <TableCell>{entry.categoryData}</TableCell>
                <TableCell>{entry.layer}</TableCell>
                <TableCell>{entry.dataSource}</TableCell>
                <TableCell className="font-mono">{entry.masterData}</TableCell>
                <TableCell>{entry.referenceData}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/catalog-knowledge/flow-process/${entry.id}`)
                    }}
                  >
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
