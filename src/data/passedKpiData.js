// Mock data for the Passed KPI report — no backend integration yet.

export const PASSED_KPI_CATEGORIES = [
  {
    id: "ran",
    name: "RAN",
    tables: [
      { id: "ran_cell_hour_2g", name: "ran_cell_hour_2g", layer: "Analytic Layer" },
      { id: "ran_cell_hour_4g", name: "ran_cell_hour_4g", layer: "Analytic Layer" },
      { id: "ran_cell_hour_5g", name: "ran_cell_hour_5g", layer: "Analytic Layer" },
      { id: "ran_cell_daily_2g", name: "ran_cell_daily_2g", layer: "Analytic Layer" },
      { id: "ran_cell_daily_4g", name: "ran_cell_daily_4g", layer: "Analytic Layer" },
      { id: "ran_cell_daily_5g", name: "ran_cell_daily_5g", layer: "Analytic Layer" },
      { id: "ran_cell_month_2g", name: "ran_cell_month_2g", layer: "Analytic Layer" },
      { id: "ran_cell_month_4g", name: "ran_cell_month_4g", layer: "Analytic Layer" },
      { id: "ran_cell_month_5g", name: "ran_cell_month_5g", layer: "Analytic Layer" },
      { id: "ran_cell_week_2g", name: "ran_cell_week_2g", layer: "Speed Layer" },
    ],
  },
  {
    id: "core_cs",
    name: "CORE CS",
    tables: [
      { id: "core_cs_hour_2g", name: "core_cs_hour_2g", layer: "Analytic Layer" },
      { id: "core_cs_daily_2g", name: "core_cs_daily_2g", layer: "Analytic Layer" },
      { id: "core_cs_month_2g", name: "core_cs_month_2g", layer: "Analytic Layer" },
    ],
  },
  {
    id: "core_ps",
    name: "CORE PS",
    tables: [
      { id: "core_ps_hour_4g", name: "core_ps_hour_4g", layer: "Analytic Layer" },
      { id: "core_ps_daily_4g", name: "core_ps_daily_4g", layer: "Analytic Layer" },
      { id: "core_ps_month_4g", name: "core_ps_month_4g", layer: "Speed Layer" },
    ],
  },
]

export const PASSED_KPI_SUMMARY = {
  completeness: { score: 80, wow: 10 },
  timeliness: { score: 100, wow: 10 },
}

export const PASSED_KPI_TOP_TABLES = {
  completeness: {
    best: [
      { label: "ran_cell_day_5g", count: 96 },
      { label: "ran_cell_day_2g", count: 93 },
      { label: "ran_cell_day_4g", count: 90 },
      { label: "ran_cell_hour_2g", count: 86 },
      { label: "ran_cell_hour_4g", count: 82 },
    ],
    worst: [
      { label: "ran_cell_hour_5g", count: 4 },
      { label: "ran_cell_month_2g", count: 9 },
      { label: "ran_cell_month_4g", count: 11 },
      { label: "ran_cell_month_5g", count: 14 },
      { label: "ran_cell_week_2g", count: 22 },
    ],
  },
  timeliness: {
    best: [
      { label: "ran_cell_day_5g", count: 100 },
      { label: "ran_cell_day_2g", count: 99 },
      { label: "ran_cell_day_4g", count: 97 },
      { label: "ran_cell_hour_2g", count: 95 },
      { label: "ran_cell_hour_4g", count: 93 },
    ],
    worst: [
      { label: "ran_cell_hour_5g", count: 12 },
      { label: "ran_cell_month_2g", count: 18 },
      { label: "ran_cell_month_4g", count: 21 },
      { label: "ran_cell_month_5g", count: 24 },
      { label: "ran_cell_week_2g", count: 30 },
    ],
  },
}

export const PASSED_KPI_TREND = {
  dates: ["01", "02", "03", "04", "05", "06", "07"],
  completeness: [88, 85, 84, 86, 90, 91, 96],
  timeliness: [96, 98, 97, 97, 98, 98, 99],
}

export const TABLE_INSIGHT_COLUMNS = [
  "total_traffic_volume",
  "volte_call_dr_rate",
  "volte_cssr_rate",
  "volte_traffic_erl",
  "radio_network_availability",
  "service_drop_rate",
]

export const TABLE_INSIGHT_THRESHOLD = 90

// Small deterministic PRNG (mulberry32) so mock data stays stable across renders/reloads.
function mulberry32(seed) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yyyy = date.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

const insightCache = new Map()

export function getTableInsight(tableId) {
  if (insightCache.has(tableId)) return insightCache.get(tableId)

  const rand = mulberry32(hashSeed(tableId) || 1)
  const dayCount = 30
  const startDate = new Date(2025, 0, 19)

  const rows = []
  let prevValues = TABLE_INSIGHT_COLUMNS.map(() => 80 + rand() * 15)

  for (let i = 0; i < dayCount; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const values = TABLE_INSIGHT_COLUMNS.map((_, colIndex) => {
      const base = 75 + rand() * 24
      return Math.min(100, Math.round(base * 100) / 100)
    })
    const deltas = values.map((v, colIndex) => Math.round((v - prevValues[colIndex]) * 100) / 100)
    prevValues = values

    const average = Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100
    const passKpi = i < 20 ? 1 : 4
    const notPassKpi = 18 - passKpi

    rows.push({
      date: formatDate(date),
      values,
      deltas,
      average,
      passKpi,
      notPassKpi,
    })
  }

  const totals = TABLE_INSIGHT_COLUMNS.map((_, colIndex) => {
    const sum = rows.reduce((acc, row) => acc + row.values[colIndex], 0)
    return Math.round((sum / rows.length) * 100) / 100
  })
  const aboveTarget = rows.reduce(
    (acc, row) => acc + row.values.filter((v) => v >= TABLE_INSIGHT_THRESHOLD).length,
    0
  )
  const overallAverage = Math.round((rows.reduce((acc, row) => acc + row.average, 0) / rows.length) * 100) / 100

  const result = { rows, totals, aboveTarget, overallAverage, threshold: TABLE_INSIGHT_THRESHOLD }
  insightCache.set(tableId, result)
  return result
}
