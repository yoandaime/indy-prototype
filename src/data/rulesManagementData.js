// Mock data source for the DQ Experience page's Rules Management tab —
// one row per registered table, with the rules applied to it grouped by
// dimension. Generated deterministically (no Math.random) so the same table
// always shows the same assigned rules across reloads.

import { getStandardRules, getDimensionKeys } from "@/lib/dqComposer/ruleCatalog"
import { DQ_CONNECTIONS } from "@/data/dqComposerMockData"

// Same registered connections as the DQ Studio tab, so a table's
// connection here maps to a real one there.
export const RULES_MANAGEMENT_CONNECTIONS = DQ_CONNECTIONS

export const RULES_MANAGEMENT_CATEGORIES = ["RAN", "CORE CS", "CORE PS", "TRANSPORT", "IT"]

const RULES_MANAGEMENT_GRANULARITIES = ["hourly", "daily", "weekly", "monthly"]

// 5 base tables per category, each rendered at every granularity above —
// 25 x 4 = 100 registered tables, matching the reference view.
const BASE_TABLES = [
  { name: "etl_cell_5g_ran_ericsson_kpi", category: "RAN", schema: "default" },
  { name: "etl_cell_4g_ran_huawei_kpi", category: "RAN", schema: "default" },
  { name: "etl_sector_4g_ericsson_performance", category: "RAN", schema: "default" },
  { name: "fact_ran_site_availability", category: "RAN", schema: "monitoring" },
  { name: "agg_ran_cell_congestion", category: "RAN", schema: "analytics" },

  { name: "agg_core_cs_traffic", category: "CORE CS", schema: "analytics" },
  { name: "etl_core_cs_call_detail", category: "CORE CS", schema: "default" },
  { name: "fact_core_cs_call_drop_rate", category: "CORE CS", schema: "monitoring" },
  { name: "etl_core_cs_msc_kpi", category: "CORE CS", schema: "default" },
  { name: "agg_core_cs_sms_delivery", category: "CORE CS", schema: "analytics" },

  { name: "agg_core_ps_data_session", category: "CORE PS", schema: "analytics" },
  { name: "etl_core_ps_pdp_context", category: "CORE PS", schema: "default" },
  { name: "fact_core_ps_throughput", category: "CORE PS", schema: "monitoring" },
  { name: "etl_core_ps_sgsn_kpi", category: "CORE PS", schema: "default" },
  { name: "agg_core_ps_apn_usage", category: "CORE PS", schema: "analytics" },

  { name: "fact_transport_link_utilization", category: "TRANSPORT", schema: "monitoring" },
  { name: "etl_transport_microwave_kpi", category: "TRANSPORT", schema: "default" },
  { name: "agg_transport_fiber_capacity", category: "TRANSPORT", schema: "analytics" },
  { name: "etl_transport_router_interface", category: "TRANSPORT", schema: "default" },
  { name: "fact_transport_latency_summary", category: "TRANSPORT", schema: "monitoring" },

  { name: "agg_it_server_health", category: "IT", schema: "analytics" },
  { name: "etl_it_network_device_status", category: "IT", schema: "default" },
  { name: "fact_billing_usage_summary", category: "IT", schema: "monitoring" },
  { name: "etl_it_application_uptime", category: "IT", schema: "default" },
  { name: "agg_it_storage_utilization", category: "IT", schema: "analytics" },
]

function hashString(text) {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function ruleTitlesForDimension(dimension) {
  return getStandardRules()
    .filter((r) => r.dimension === dimension)
    .map((r) => r.title)
}

// Deterministic, stable-looking subset of the available rules for a given
// table + dimension — same inputs always produce the same rule list.
function pickRules(fullTableName, dimension, forceEmpty) {
  const options = ruleTitlesForDimension(dimension)
  if (forceEmpty || options.length === 0) return []
  const hash = hashString(`${fullTableName}:${dimension}`)
  const count = hash % (options.length + 1)
  const offset = hash % options.length
  const rotated = [...options.slice(offset), ...options.slice(0, offset)]
  return rotated.slice(0, count)
}

function buildRow(base, granularity, index) {
  const table = `${base.name}_${granularity}`
  const fullName = `${base.schema}.${table}`
  const connection = RULES_MANAGEMENT_CONNECTIONS[index % RULES_MANAGEMENT_CONNECTIONS.length]
  // Roughly 1 in 7 tables has no rules configured at all, so the
  // "Unconfigured only" filter has something real to show.
  const forceEmpty = index % 7 === 0

  const rulesByDimension = {}
  for (const dimension of getDimensionKeys()) {
    rulesByDimension[dimension] = pickRules(fullName, dimension, forceEmpty)
  }

  return {
    id: `rmt_${index + 1}`,
    schema: base.schema,
    table,
    connection,
    category: base.category,
    granularity,
    rulesByDimension,
  }
}

export function makeRulesManagementRows() {
  const rows = []
  let index = 0
  for (const base of BASE_TABLES) {
    for (const granularity of RULES_MANAGEMENT_GRANULARITIES) {
      rows.push(buildRow(base, granularity, index))
      index += 1
    }
  }
  return rows
}

export function fullRulesManagementTableName(row) {
  return `${row.schema}.${row.table}`
}

export function countRulesForRow(row) {
  return getDimensionKeys().reduce((sum, dim) => sum + (row.rulesByDimension[dim]?.length || 0), 0)
}
