import { useState } from "react"
import { Layers, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CATEGORIES = []
const REQUESTS = []

export default function ManageCategoriesSection() {
  const [tab, setTab] = useState("categories")

  return (
    <div className="w-full flex-1 space-y-4.5 bg-white p-8">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <div>
              <h1 className="text-sm font-semibold text-foreground">Manage Forum Categories</h1>
              <p className="text-xs text-muted-foreground">
                Add, edit, or remove discussion categories. All changes are logged to audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
              </TabsList>
            </Tabs>

            {tab === "categories" && (
              <Button size="sm">
                <Plus className="size-4" />
                Create Root Category
              </Button>
            )}
          </div>

          {tab === "categories" && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-muted-foreground">
              {CATEGORIES.length === 0
                ? "No categories found. Create a new category above to get started."
                : null}
            </div>
          )}

          {tab === "requests" && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-muted-foreground">
              {REQUESTS.length === 0 ? "No category requests found." : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
