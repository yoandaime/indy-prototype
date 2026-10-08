import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import QualityStackedBar from "@/components/catalogKnowledge/QualityStackedBar"
import { DATA_CATALOG_ENTRIES, DATA_CATALOG_SOURCE_STYLES } from "@/data/dataCatalogData"
import { cn } from "@/lib/utils"

export default function DataCatalogSection() {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return DATA_CATALOG_ENTRIES

    return DATA_CATALOG_ENTRIES.filter((entry) =>
      entry.tableName.toLowerCase().includes(query) ||
      entry.layerName.toLowerCase().includes(query) ||
      entry.categoryData.toLowerCase().includes(query) ||
      entry.dataOwner.toLowerCase().includes(query) ||
      entry.source.toLowerCase().includes(query)
    )
  }, [search])

  return (
    <div className="h-full min-w-0 flex-1 space-y-6 overflow-y-auto bg-white px-10 pt-6 pb-10">
      <div className="space-y-0.5">
        <h2 className="text-xl leading-6 font-semibold text-foreground">Data Catalog</h2>
        <p className="text-xs leading-4 text-neutral-600">
          Browse registered tables, their quality summary, and ownership across data layers.
        </p>
      </div>

      <div className="space-y-3.5">
        <div className="relative w-full max-w-[397px]">
          <Input
            placeholder="Search by table, layer, category, owner, source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pr-9"
          />
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>Table Name</TableHead>
                <TableHead>Layer Name</TableHead>
                <TableHead>Category Data</TableHead>
                <TableHead>Data Owner</TableHead>
                <TableHead>Quality Summary</TableHead>
                <TableHead>Granularity Time</TableHead>
                <TableHead>Granularity Location</TableHead>
                <TableHead>Recurring Data Update</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No matching tables found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entry) => (
                  <TableRow key={`${entry.id}-${entry.tableName}`}>
                    <TableCell className="font-mono">{entry.tableName}</TableCell>
                    <TableCell>{entry.layerName}</TableCell>
                    <TableCell className="font-mono">{entry.categoryData}</TableCell>
                    <TableCell>{entry.dataOwner}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <QualityStackedBar passPercent={entry.qualityPass} />
                        <span className="text-xs text-muted-foreground">{entry.qualityPass}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{entry.granularityTime}</TableCell>
                    <TableCell>{entry.granularityLocation}</TableCell>
                    <TableCell>{entry.recurringUpdate}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("rounded-lg font-semibold", DATA_CATALOG_SOURCE_STYLES[entry.source])}
                      >
                        {entry.source}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
