import { useMemo, useState } from "react"
import { Search, ChevronRight, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function ReportCategoryPicker({ categories, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? null)
  const [search, setSearch] = useState("")

  const selectedTable = useMemo(() => {
    for (const category of categories) {
      const table = category.tables.find((t) => t.id === value)
      if (table) return table
    }
    return null
  }, [categories, value])

  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? categories[0]

  const filteredTables = useMemo(() => {
    if (!activeCategory) return []
    const query = search.trim().toLowerCase()
    if (!query) return activeCategory.tables
    return activeCategory.tables.filter((t) => t.name.toLowerCase().includes(query))
  }, [activeCategory, search])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setSearch("")
      }}
    >
      <PopoverTrigger className="flex h-8 w-[220px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none hover:bg-muted">
        <span className="truncate">
          {selectedTable ? (
            <>
              {selectedTable.name} <span className="text-muted-foreground">{selectedTable.layer}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select report category</span>
          )}
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[440px] p-0">
        <div className="flex h-[280px]">
          <div className="w-[150px] shrink-0 border-r p-1.5">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-1 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                  activeCategoryId === category.id && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
                )}
              >
                {category.name}
                <ChevronRight className="size-3.5 shrink-0" />
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col p-1.5">
            <div className="relative mb-1.5 shrink-0">
              <Input
                placeholder="title"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pr-8"
              />
              <Search className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredTables.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">No tables found.</p>
              ) : (
                filteredTables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => {
                      onChange(table.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                      value === table.id && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
                    )}
                  >
                    <span className="truncate">
                      {table.name} <span className="text-muted-foreground">{table.layer}</span>
                    </span>
                    {value === table.id && <Check className="size-3.5 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
