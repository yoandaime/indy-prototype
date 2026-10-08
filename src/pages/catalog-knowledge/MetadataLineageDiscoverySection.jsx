import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import LineageDiagram from "@/components/catalogKnowledge/LineageDiagram"
import { LINEAGE_NODES, LINEAGE_EDGES } from "@/data/lineageDiscoveryData"

export default function MetadataLineageDiscoverySection() {
  const [showDqValue, setShowDqValue] = useState(false)

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col gap-6 overflow-y-auto bg-white px-10 pt-6 pb-10">
      <div className="space-y-0.5">
        <h2 className="text-xl leading-6 font-semibold text-foreground">Metadata & Lineage Discovery</h2>
        <p className="text-xs leading-4 text-neutral-600">
          Explore metadata and trace data lineage across sources, layers, and consumers.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="show-dq-value" checked={showDqValue} onCheckedChange={setShowDqValue} />
        <label htmlFor="show-dq-value" className="text-sm text-neutral-700">
          Show Data Quality Score
        </label>
      </div>

      <div className="h-[520px] w-full overflow-hidden rounded-lg border">
        <LineageDiagram nodes={LINEAGE_NODES} edges={LINEAGE_EDGES} showDqValue={showDqValue} />
      </div>
    </div>
  )
}
