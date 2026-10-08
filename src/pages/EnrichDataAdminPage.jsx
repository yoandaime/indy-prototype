import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search } from "lucide-react"
import { ADMIN_CONNECTIONS } from "@/data/adminConnections"
import { useAccess } from "@/context/AccessContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const PAGE_SIZE = 10

export default function EnrichDataAdminPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const { role } = useAccess()
  const isUserView = role === "user"

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ADMIN_CONNECTIONS

    return ADMIN_CONNECTIONS.filter((c) =>
      String(c.connection_id).includes(q) ||
      c.group_apps.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.layer_name.toLowerCase().includes(q) ||
      c.table_name.toLowerCase().includes(q) ||
      c.granularity.toLowerCase().includes(q)
    )
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [search])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="h-full min-w-0 flex-1 space-y-6 overflow-y-auto pt-5 px-10 pb-10 ]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl leading-6 font-semibold text-foreground">Registered Data Sources</h2>
          <p className="text-xs leading-4 text-neutral-600">
            {isUserView
              ? "Data that you've already registered on the NDQ Enrich platform."
              : "All data source connections registered on the NDQ Enrich platform."}
          </p>
        </div>
        <Button onClick={() => navigate("/enrich-data/admin/new")}>
          <Plus className="size-4" />
          Add New Data
        </Button>
      </div>

      <div className="space-y-3.5">
        <div className="relative w-full max-w-[397px]">
          <Input
            placeholder="Search by ID, group, category, layer, table, granularity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pr-9"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>No</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Group Apps</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Layer</TableHead>
                <TableHead>Table Name</TableHead>
                <TableHead>Control Table</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Granularity</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>OLA Readiness</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((c, i) => (
                <TableRow
                  key={c.connection_id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/enrich-data/admin/${c.connection_id}`)}
                >
                  <TableCell>{(page - 1) * PAGE_SIZE + i + 1}.</TableCell>
                  <TableCell>{c.connection_id}</TableCell>
                  <TableCell>{c.group_apps}</TableCell>
                  <TableCell>{c.category}</TableCell>
                  <TableCell>{c.layer_name}</TableCell>
                  <TableCell className="font-mono">{c.table_name}</TableCell>
                  <TableCell className="font-mono">{c.control_table}</TableCell>
                  <TableCell className="font-mono">{c.reference}</TableCell>
                  <TableCell>{c.granularity}</TableCell>
                  <TableCell>
                    <div className="flex min-w-[260px] flex-wrap gap-1">
                      {c.features.map((f) => (
                        <Badge key={f} variant="secondary" className="rounded-lg font-semibold">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{c.ola_readiness}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/enrich-data/admin/${c.connection_id}`)
                      }}
                    >
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground">
                    No connections match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setPage((p) => Math.max(1, p - 1))
                  }}
                  aria-disabled={page === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault()
                      setPage(p)
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setPage((p) => Math.min(totalPages, p + 1))
                  }}
                  aria-disabled={page === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}
