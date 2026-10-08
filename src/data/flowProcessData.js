export const FLOW_QUALITY_DIMENSIONS = [
  { key: "completeness", label: "Completeness" },
  { key: "uniqueness", label: "Uniqueness" },
  { key: "consistency", label: "Consistency" },
  { key: "validity", label: "Validity" },
  { key: "accuracy", label: "Accuracy" },
  { key: "timeliness", label: "Timeliness" },
]

// Base facts per data category. Everything dimension-specific (flow shape,
// source detail copy) is derived from this + the dimension builders below,
// so both the category (row) AND the dimension (tab) change what renders.
const CATEGORIES = [
  {
    id: 1,
    categoryData: "CORE CS",
    layer: "Slow Layer",
    dataSource: "OSS",
    masterData: "core_ne_hour",
    referenceData: "master reference lookup",
    sourceLabel: "CORE PS",
    tableId: "core_ne_hour.core_ne_day",
    rawPath: "interconnection_source.core_cs_hour",
    masterPath: "master_reference.core_cs_lookup",
    referencePath: "reference_data.core_cs_region_dim",
    columns: ["date", "lac", "ci", "cell_name", "vendor", "region", "insert_date", "total_payload_mbyte", "tech_traffic_sum", "cssr_voice_rate"],
    keyColumns: ["lac", "ci", "cell_name"],
    rangeColumns: ["cssr_voice_rate", "tech_traffic_sum"],
    timestampColumns: ["date", "insert_date"],
    expectedLag: "<= 2h",
    masterColumns: ["cell_id", "cell_name", "site_id", "region", "vendor", "tech_type", "active_flag", "last_updated"],
    referenceColumns: ["region", "vendor", "tech_type"],
  },
  {
    id: 2,
    categoryData: "RAN",
    layer: "Speed Layer",
    dataSource: "OSS",
    masterData: "core_ne_hour",
    referenceData: "master reference lookup",
    sourceLabel: "RAN PS",
    tableId: "cell_hour_2g.cell_hour_4g",
    rawPath: "interconnection_source.ran_cell_day_2g",
    masterPath: "master_reference.ran_cell_lookup",
    referencePath: "reference_data.ran_region_dim",
    columns: ["date", "lac", "ci", "cell_name", "vendor", "region", "insert_date", "total_payload_mbyte", "tech_traffic_sum", "cssr_voice_rate"],
    keyColumns: ["lac", "ci", "cell_name"],
    rangeColumns: ["cssr_voice_rate", "tech_traffic_sum"],
    timestampColumns: ["date", "insert_date"],
    expectedLag: "<= 1h",
    masterColumns: ["cell_id", "cell_name", "site_id", "band", "vendor", "tech_type", "active_flag", "last_updated"],
    referenceColumns: ["region", "band", "vendor"],
  },
  {
    id: 3,
    categoryData: "TRANSPORT DATACOM",
    layer: "Slow Layer",
    dataSource: "OSS",
    masterData: "core_ne_hour",
    referenceData: "master reference lookup",
    sourceLabel: "DATACOM PS",
    tableId: "datacom_link_hour.datacom_link_day",
    rawPath: "interconnection_source.datacom_link_hour",
    masterPath: "master_reference.datacom_link_lookup",
    referencePath: "reference_data.datacom_region_dim",
    columns: ["date", "link_id", "node_a", "node_b", "vendor", "region", "insert_date", "utilization_pct", "error_rate", "latency_ms"],
    keyColumns: ["link_id", "node_a", "node_b"],
    rangeColumns: ["utilization_pct", "error_rate", "latency_ms"],
    timestampColumns: ["date", "insert_date"],
    expectedLag: "<= 1h",
    masterColumns: ["link_id", "node_a", "node_b", "capacity_mbps", "vendor", "link_type", "active_flag", "last_updated"],
    referenceColumns: ["region", "link_type", "vendor"],
  },
  {
    id: 4,
    categoryData: "TRANSPORT RAN",
    layer: "Slow Layer",
    dataSource: "OSS",
    masterData: "core_ne_hour",
    referenceData: "master reference lookup",
    sourceLabel: "RAN TRANSPORT PS",
    tableId: "transport_ran_hour.transport_ran_day",
    rawPath: "interconnection_source.transport_ran_hour",
    masterPath: "master_reference.transport_ran_lookup",
    referencePath: "reference_data.transport_region_dim",
    columns: ["date", "site_id", "hop_id", "vendor", "region", "insert_date", "availability_pct", "rx_level_dbm", "tx_power_dbm", "bandwidth_mbps"],
    keyColumns: ["hop_id", "site_id"],
    rangeColumns: ["availability_pct", "rx_level_dbm", "tx_power_dbm"],
    timestampColumns: ["date", "insert_date"],
    expectedLag: "<= 3h",
    masterColumns: ["hop_id", "site_a", "site_b", "vendor", "frequency_band", "active_flag", "last_updated"],
    referenceColumns: ["region", "frequency_band", "vendor"],
  },
  {
    id: 5,
    categoryData: "FMC",
    layer: "Slow Layer",
    dataSource: "OSS",
    masterData: "core_ne_hour",
    referenceData: "master reference lookup",
    sourceLabel: "FMC PS",
    tableId: "fmc_session_hour.fmc_session_day",
    rawPath: "interconnection_source.fmc_session_hour",
    masterPath: "master_reference.fmc_subscriber_lookup",
    referencePath: "reference_data.fmc_region_dim",
    columns: ["date", "subscriber_id", "device_type", "region", "insert_date", "session_count", "session_duration_sec", "handover_success_rate", "drop_rate_pct", "data_volume_mbyte"],
    keyColumns: ["subscriber_id", "device_type"],
    rangeColumns: ["handover_success_rate", "drop_rate_pct"],
    timestampColumns: ["date", "insert_date"],
    expectedLag: "<= 2h",
    masterColumns: ["subscriber_id", "msisdn", "device_type", "plan_type", "region", "active_flag", "last_updated"],
    referenceColumns: ["region", "plan_type", "device_type"],
  },
]

// Each dimension builds its own flow SHAPE (different node kinds/branching,
// not a copy of another dimension's diagram) from just the category's source
// label. buildSourceDetail returns exactly one block per "label"-kind node in
// that same flow (the raw data boxes — source/master/reference), in the same
// order they appear in `nodes`, NOT a fixed count: a 1-source-node dimension
// (uniqueness, validity, accuracy, timeliness) gets 1 block, a 3-source-node
// one (completeness) gets 3. Colored process nodes (Join/Filter/Compare/...)
// never get a block — they're operations, not data sources.
const DIMENSION_BUILDERS = {
  completeness: {
    buildFlow: (sourceLabel) => ({
      nodes: [
        { id: "source", kind: "label", label: sourceLabel, x: 0, y: 80 },
        { id: "master", kind: "label", label: "Master Data", x: 260, y: 0 },
        { id: "reference", kind: "label", label: "Reference Data", x: 260, y: 160 },
        { id: "join", kind: "join", label: "Join", x: 560, y: 80 },
        { id: "filter", kind: "filter", label: "Filter Nulls", x: 820, y: 80 },
      ],
      edges: [
        { id: "e1", source: "source", target: "master" },
        { id: "e2", source: "source", target: "reference" },
        { id: "e3", source: "master", target: "join" },
        { id: "e4", source: "reference", target: "join" },
        { id: "e5", source: "join", target: "filter", dashed: true },
      ],
    }),
    buildSourceDetail: (c) => [
      {
        nodeLabel: c.sourceLabel,
        pathId: c.rawPath,
        content: `Required fields checked for null/missing values: ${c.columns.join(",")}`,
      },
      {
        nodeLabel: "Master Data",
        pathId: c.masterPath,
        content: `Joined reference columns: ${c.masterColumns.join(",")}`,
      },
      {
        nodeLabel: "Reference Data",
        pathId: c.referencePath,
        content: `Joined reference columns: ${c.referenceColumns.join(",")}`,
      },
    ],
  },
  uniqueness: {
    buildFlow: (sourceLabel) => ({
      nodes: [
        { id: "source", kind: "label", label: sourceLabel, x: 0, y: 80 },
        { id: "dedupe", kind: "dedupe", label: "Deduplicate", x: 300, y: 80 },
        { id: "filter", kind: "filter", label: "Filter Duplicates", x: 620, y: 80 },
      ],
      edges: [
        { id: "e1", source: "source", target: "dedupe" },
        { id: "e2", source: "dedupe", target: "filter", dashed: true },
      ],
    }),
    buildSourceDetail: (c) => [
      {
        nodeLabel: c.sourceLabel,
        pathId: c.rawPath,
        content: `Duplicate check key (composite): ${c.keyColumns.join(",")}. Row is flagged duplicate when all key columns match an earlier insert_date for the same key.`,
      },
    ],
  },
  consistency: {
    buildFlow: (sourceLabel) => ({
      nodes: [
        { id: "source", kind: "label", label: sourceLabel, x: 0, y: 20 },
        { id: "reference", kind: "label", label: "Reference Source", x: 0, y: 160 },
        { id: "compare", kind: "compare", label: "Compare", x: 320, y: 90 },
        { id: "filter", kind: "filter", label: "Filter Mismatch", x: 620, y: 90 },
      ],
      edges: [
        { id: "e1", source: "source", target: "compare" },
        { id: "e2", source: "reference", target: "compare" },
        { id: "e3", source: "compare", target: "filter", dashed: true },
      ],
    }),
    buildSourceDetail: (c) => [
      {
        nodeLabel: c.sourceLabel,
        pathId: c.rawPath,
        content: `Primary values compared: ${c.rangeColumns.join(",")}`,
      },
      {
        nodeLabel: "Reference Source",
        pathId: c.referencePath,
        content: `Cross-checked against reference values: ${c.referenceColumns.join(",")}`,
      },
    ],
  },
  validity: {
    buildFlow: (sourceLabel) => ({
      nodes: [
        { id: "source", kind: "label", label: sourceLabel, x: 0, y: 80 },
        { id: "validate", kind: "validate", label: "Validate", x: 300, y: 80 },
        { id: "filter", kind: "filter", label: "Pass", x: 620, y: 10 },
        { id: "reject", kind: "reject", label: "Reject", x: 620, y: 150 },
      ],
      edges: [
        { id: "e1", source: "source", target: "validate" },
        { id: "e2", source: "validate", target: "filter" },
        { id: "e3", source: "validate", target: "reject", dashed: true },
      ],
    }),
    buildSourceDetail: (c) => [
      {
        nodeLabel: c.sourceLabel,
        pathId: c.rawPath,
        content: `Format/range rules: ${c.rangeColumns.map((col) => `${col} (0-100)`).join(", ")}. Rows outside range or with a malformed key (${c.keyColumns.join(",")}) are routed to Reject.`,
      },
    ],
  },
  accuracy: {
    buildFlow: (sourceLabel) => ({
      nodes: [
        { id: "source", kind: "label", label: sourceLabel, x: 0, y: 20 },
        { id: "lookup", kind: "lookup", label: "Reference Lookup", x: 0, y: 160 },
        { id: "compare", kind: "compare", label: "Compare", x: 340, y: 90 },
        { id: "filter", kind: "filter", label: "Filter Drift", x: 640, y: 90 },
      ],
      edges: [
        { id: "e1", source: "source", target: "compare" },
        { id: "e2", source: "lookup", target: "compare" },
        { id: "e3", source: "compare", target: "filter", dashed: true },
      ],
    }),
    buildSourceDetail: (c) => [
      {
        nodeLabel: c.sourceLabel,
        pathId: c.rawPath,
        content: `Computed values checked for drift against ${c.masterPath}: ${c.rangeColumns.join(",")}`,
      },
    ],
  },
  timeliness: {
    buildFlow: (sourceLabel) => ({
      nodes: [
        { id: "source", kind: "label", label: sourceLabel, x: 0, y: 80 },
        { id: "timestamp", kind: "timestamp", label: "Timestamp Check", x: 320, y: 80 },
        { id: "filter", kind: "filter", label: "Filter Stale", x: 640, y: 80 },
      ],
      edges: [
        { id: "e1", source: "source", target: "timestamp" },
        { id: "e2", source: "timestamp", target: "filter", dashed: true },
      ],
    }),
    buildSourceDetail: (c) => [
      {
        nodeLabel: c.sourceLabel,
        pathId: c.rawPath,
        content: `Freshness checked on: ${c.timestampColumns.join(",")}, expected lag ${c.expectedLag}. Rows where insert_date - date exceeds ${c.expectedLag} are flagged stale.`,
      },
    ],
  },
}

export const FLOW_PROCESS_ENTRIES = CATEGORIES.map((category) => ({
  id: category.id,
  categoryData: category.categoryData,
  layer: category.layer,
  dataSource: category.dataSource,
  masterData: category.masterData,
  referenceData: category.referenceData,
  title: category.categoryData,
  subtitlePath: `${category.categoryData} / ${category.layer} / NDM Slow Layer / ${category.tableId} / chrono_sysinfo`,
  dimensions: Object.fromEntries(
    FLOW_QUALITY_DIMENSIONS.map(({ key }) => {
      const builder = DIMENSION_BUILDERS[key]
      return [
        key,
        {
          ...builder.buildFlow(category.sourceLabel),
          sourceDetail: builder.buildSourceDetail(category),
        },
      ]
    })
  ),
}))
