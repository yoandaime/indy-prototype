import { useMemo, useState } from "react"
import { useOutletContext, useNavigate } from "react-router-dom"
import { Search, ChevronRight, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export default function PicCategorySection() {
  const { picCategories } = useOutletContext()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")

  const noPicCategories = useMemo(
    () => picCategories.filter((c) => c.l0.length + c.l1.length + c.l2.length === 0),
    [picCategories]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return picCategories
    return picCategories.filter((c) => c.name.toLowerCase().includes(q))
  }, [picCategories, search])

  return (
    <div className="w-full flex-1 space-y-4.5 bg-white p-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">PIC Category</h1>
        <p className="text-sm text-muted-foreground">
          Who handles each category, split across L0, L1 and L2. Open a category to edit its PICs.
        </p>
      </div>

      {noPicCategories.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {noPicCategories.length} categories have no PIC at any level
            </p>
            <p className="text-sm text-amber-700">{noPicCategories.map((c) => c.name).join(", ")}</p>
          </div>
        </div>
      )}

      <div className="relative w-[320px]">
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pr-8 font-normal shadow-xs"
        />
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <Table>
          <TableHeader>
            <TableRow className="h-9 border-neutral-200 bg-neutral-100 hover:bg-neutral-100">
              <TableHead className="text-sm font-medium text-neutral-600">Category</TableHead>
              <TableHead className="text-sm font-medium text-neutral-600">Total</TableHead>
              <TableHead className="text-sm font-medium text-neutral-600">L0</TableHead>
              <TableHead className="text-sm font-medium text-neutral-600">L1</TableHead>
              <TableHead className="text-sm font-medium text-neutral-600">L2</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer border-neutral-200"
                onClick={() => navigate(`/ticketing/admin/pic-category/${c.id}`)}
              >
                <TableCell className="text-sm text-foreground">{c.name}</TableCell>
                <TableCell className="text-sm text-foreground">{c.l0.length + c.l1.length + c.l2.length}</TableCell>
                <TableCell className="text-sm text-foreground">{c.l0.length}</TableCell>
                <TableCell className="text-sm text-foreground">{c.l1.length}</TableCell>
                <TableCell className="text-sm text-foreground">{c.l2.length}</TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
