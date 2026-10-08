import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BUSINESS_GLOSSARY_GROUPS } from "@/data/businessGlossaryData"
import glossaryHeroDecoration from "@/assets/catalog-knowledge/glossary-hero-decoration-dark.svg"

export default function BusinessGlossarySection() {
  const [search, setSearch] = useState("")

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return BUSINESS_GLOSSARY_GROUPS

    return BUSINESS_GLOSSARY_GROUPS.map((group) => ({
      ...group,
      terms: group.terms.filter((term) => term.toLowerCase().includes(query)),
    })).filter((group) => group.terms.length > 0)
  }, [search])

  return (
    <div className="h-full min-w-0 flex-1 overflow-y-auto bg-white px-10 pt-10 pb-10">
      <div className="relative mx-auto w-full max-w-[1100px] overflow-hidden rounded-[20px] bg-gradient-to-r from-[#a8011b] to-[#56010e] px-6 py-10 sm:px-10">
        <img
          src={glossaryHeroDecoration}
          alt=""
          className="pointer-events-none absolute -top-6 -right-6 h-[142px] w-[136px]"
        />

        <div className="relative mx-auto flex w-full max-w-[513px] flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-medium text-white">Find knowledge for data categories</h1>
            <p className="text-xs text-white">
              find in-depth knowledge regarding the data you want to know, RAN, CORE CS and others.
            </p>
          </div>

          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-5 size-6 -translate-y-1/2 text-white" />
            <Input
              placeholder="search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-full border-none bg-white/40 pl-14 text-base text-white shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] placeholder:text-white/80 focus-visible:ring-white/50"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-[1100px]">
        <div className="rounded-3xl border bg-white p-10 shadow-sm">
          <div className="flex items-center justify-start gap-4">
            <Button variant="outline">
              <Plus className="size-4" />
              Add Glossary
            </Button>
          </div>

          {groups.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">No glossary terms found.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
              {groups.map(({ letter, terms }) => (
                <div key={letter} className="flex flex-col gap-1">
                  <p className="text-lg font-semibold text-foreground">{letter}</p>
                  {terms.map((term) => (
                    <a
                      key={term}
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-sm text-neutral-700 underline underline-offset-2 hover:text-primary"
                    >
                      {term}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
