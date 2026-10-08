export const LINEAGE_NODES = [
  {
    id: "data-source",
    kind: "source",
    label: "Data Source",
    x: 0,
    y: 0,
    dqValue: 92,
    completeness: 92,
    timeliness: 98,
    totalData: 1000,
  },
  {
    id: "pipeline",
    kind: "pipeline",
    label: "Pipeline",
    x: 260,
    y: 0,
    dqValue: 87,
    completeness: 85,
    timeliness: 90,
    totalData: 1000,
  },
  {
    id: "data-warehouse",
    kind: "warehouse",
    label: "Data Warehouse",
    x: 520,
    y: 0,
    dqValue: 95,
    completeness: 96,
    timeliness: 100,
    totalData: 1000,
  },
]

export const LINEAGE_EDGES = [
  { id: "data-source-pipeline", source: "data-source", target: "pipeline" },
  { id: "pipeline-data-warehouse", source: "pipeline", target: "data-warehouse" },
]
