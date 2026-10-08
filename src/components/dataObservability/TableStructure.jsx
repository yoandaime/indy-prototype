import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Shown on the right after "Describe": the described table's columns, their
// types and whether each is part of the primary key.
export default function TableStructure({ columns }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-sm font-medium text-foreground">Table Structure ({columns.length} columns)</p>
      <div className="max-h-[calc(100vh-220px)] overflow-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead>Column</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Is In Primary Key</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columns.map((c) => (
              <TableRow key={c.column}>
                <TableCell className="font-medium text-foreground">{c.column}</TableCell>
                <TableCell className="text-muted-foreground">{c.type}</TableCell>
                <TableCell>{String(Boolean(c.is_primary_key))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
