import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import FlowProcessDiagram from "@/components/catalogKnowledge/FlowProcessDiagram"
import { FLOW_PROCESS_ENTRIES, FLOW_QUALITY_DIMENSIONS } from "@/data/flowProcessData"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function BackButton() {
  return (
    <Button
      variant="secondary"
      size="icon-sm"
      nativeButton={false}
      render={<Link to="/catalog-knowledge/flow-process" aria-label="Back" />}
    >
      <ChevronLeft className="size-3" />
    </Button>
  )
}

export default function FlowProcessDetailPage() {
  const { id } = useParams()
  const entry = FLOW_PROCESS_ENTRIES.find((item) => String(item.id) === id)
  const [dimension, setDimension] = useState(FLOW_QUALITY_DIMENSIONS[0].key)

  if (!entry) {
    return (
      <div className="h-full min-w-0 flex-1 space-y-4 overflow-y-auto bg-white px-10 py-6">
        <Link to="/catalog-knowledge/flow-process" className="text-sm text-primary hover:underline">
          Back to Flow Process
        </Link>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          No flow process found for ID "{id}".
        </div>
      </div>
    )
  }

  const activeDimension = entry.dimensions[dimension]

  return (
    <div className="flex h-full min-w-0 flex-col overflow-y-auto bg-white">
      <div className="flex items-center gap-2 border-b pl-4 pr-10 py-4">
        <BackButton />
        <p className="text-sm font-medium text-foreground">{entry.subtitlePath}</p>
      </div>

      <div className="flex min-h-[280px] flex-1 border-b">
        <aside className="flex w-[180px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r bg-white p-4">
          {FLOW_QUALITY_DIMENSIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setDimension(key)}
              className={cn(
                "flex h-8 w-full items-center rounded-md px-2 text-sm text-neutral-700 hover:bg-muted",
                dimension === key && "bg-[#fdecee] text-primary hover:bg-[#fdecee]"
              )}
            >
              {label}
            </button>
          ))}
        </aside>

        <div className="relative min-w-0 flex-1">
          <FlowProcessDiagram nodes={activeDimension.nodes} edges={activeDimension.edges} />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        <h3 className="text-sm font-semibold text-foreground">Source Detail</h3>

        <div className="h-[200px] space-y-4 overflow-y-auto">
          {activeDimension.sourceDetail.map((source, index) => (
            <div
              key={`${source.pathId}-${index}`}
              className="space-y-1.5 rounded-xl border bg-muted/50 p-4"
            >
              <p className="text-xs font-semibold text-foreground">{source.nodeLabel}</p>
              <p className="text-xs text-neutral-500">
                path_source_or_database_name_or_group_id:{" "}
                <span className="font-mono text-foreground">{source.pathId}</span>
              </p>
              <p className="text-xs text-neutral-500">
                Content: <span className="font-mono text-foreground">{source.content}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
