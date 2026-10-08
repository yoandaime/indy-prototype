import { useMemo } from "react"
import { ReactFlow, Background, Handle, Position } from "@xyflow/react"
import { GitMerge, Filter, Layers, GitCompare, ShieldCheck, ShieldX, Search, Clock } from "lucide-react"
import "@xyflow/react/dist/style.css"

const PROCESS_KIND_CONFIG = {
  join: { icon: GitMerge, color: "#2563eb" },
  filter: { icon: Filter, color: "#7c3aed" },
  dedupe: { icon: Layers, color: "#d97706" },
  compare: { icon: GitCompare, color: "#0d9488" },
  validate: { icon: ShieldCheck, color: "#059669" },
  reject: { icon: ShieldX, color: "#e11d48" },
  lookup: { icon: Search, color: "#4f46e5" },
  timestamp: { icon: Clock, color: "#b45309" },
}

function LabelNode({ data }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm">
      <Handle type="target" position={Position.Left} className="!size-2 !border-neutral-300 !bg-white" />
      {data.label}
      <Handle type="source" position={Position.Right} className="!size-2 !border-neutral-300 !bg-white" />
    </div>
  )
}

function ProcessNode({ data }) {
  const { icon: Icon, color } = PROCESS_KIND_CONFIG[data.kind] ?? PROCESS_KIND_CONFIG.join

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      <Handle type="target" position={Position.Left} className="!size-2 !border-white !bg-white/60" />
      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-white/20">
        <Icon className="size-3.5" />
      </span>
      {data.label}
      <Handle type="source" position={Position.Right} className="!size-2 !border-white !bg-white/60" />
    </div>
  )
}

const nodeTypes = { label: LabelNode, process: ProcessNode }

export default function FlowProcessDiagram({ nodes: nodeDefs, edges: edgeDefs }) {
  const nodes = useMemo(
    () =>
      nodeDefs.map((node) => ({
        id: node.id,
        type: node.kind === "label" ? "label" : "process",
        position: { x: node.x, y: node.y },
        data: { label: node.label, kind: node.kind },
        draggable: false,
      })),
    [nodeDefs]
  )

  const edges = useMemo(
    () =>
      edgeDefs.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        style: edge.dashed ? { strokeDasharray: "4 4", stroke: "#9ca3af" } : { stroke: "#9ca3af" },
      })),
    [edgeDefs]
  )

  return (
    <ReactFlow
      key={nodeDefs.map((n) => n.id).join("-")}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      proOptions={{ hideAttribution: true }}
      style={{ backgroundColor: "#FCFCFC" }}
    >
      <Background variant="dots" gap={16} size={1.5} color="#a3a3a3" />
    </ReactFlow>
  )
}
