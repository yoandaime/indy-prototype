// Mock "Run Analysis" engine — computes the same metrics the generated SQL
// would produce, but directly over the in-memory mock rows instead of
// executing against a real database. Grouping/semantics mirror
// core/rules.py; only the execution engine (DuckDB -> plain JS) differs.
//
// Note on lookback_days: the reference backend filters WHERE partition_column
// >= current_timestamp - INTERVAL 'N days'. The mock rows are fixed sample
// dates, so filtering against the *real* current date would exclude nearly
// all of them. Instead we anchor "now" to the latest timestamp present in
// each table's own mock rows, so lookback_days stays meaningful regardless
// of when this runs.

import { EXPECTED_PERIODS_PER_DAY } from "./constants"

function round2(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return Math.round(value * 100) / 100
}

function pad(n) {
  return String(n).padStart(2, "0")
}

function periodLabel(rawValue, granularity) {
  const date = new Date(rawValue)
  if (Number.isNaN(date.getTime())) return String(rawValue)

  const y = date.getFullYear()
  const mo = pad(date.getMonth() + 1)
  const d = pad(date.getDate())

  switch (granularity) {
    case "five_minutely": {
      const m = Math.floor(date.getMinutes() / 5) * 5
      return `${y}-${mo}-${d} ${pad(date.getHours())}:${pad(m)}`
    }
    case "quarter_hourly": {
      const m = Math.floor(date.getMinutes() / 15) * 15
      return `${y}-${mo}-${d} ${pad(date.getHours())}:${pad(m)}`
    }
    case "hourly":
      return `${y}-${mo}-${d} ${pad(date.getHours())}:00`
    case "weekly": {
      const dow = date.getDay()
      const diff = (dow + 6) % 7
      const monday = new Date(date)
      monday.setDate(date.getDate() - diff)
      return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`
    }
    case "monthly":
      return `${y}-${mo}`
    case "daily":
    default:
      return `${y}-${mo}-${d}`
  }
}

function filterByLookback(rows, partitionColumn, lookbackDays) {
  const times = rows.map((r) => new Date(r[partitionColumn]).getTime()).filter((t) => !Number.isNaN(t))
  if (!times.length) return rows
  const maxTime = Math.max(...times)
  const cutoff = maxTime - Number(lookbackDays) * 24 * 3600 * 1000
  return rows.filter((r) => {
    const t = new Date(r[partitionColumn]).getTime()
    return !Number.isNaN(t) && t >= cutoff
  })
}

function groupByPeriod(rows, partitionColumn, granularity) {
  const groups = new Map()
  for (const row of rows) {
    const key = periodLabel(row[partitionColumn], granularity)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  return groups
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === ""
}

function sortByPeriodDesc(rows) {
  return [...rows].sort((a, b) => (a.period < b.period ? 1 : a.period > b.period ? -1 : 0))
}

function applyLimit(rows, limit) {
  const n = Number(limit)
  if (!n) return rows
  return rows.slice(0, n)
}

function aggregate(values, fn) {
  const nums = values.filter((v) => typeof v === "number" && !Number.isNaN(v))
  if (fn === "count") return nums.length
  if (!nums.length) return null
  switch (fn) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0)
    case "max":
      return Math.max(...nums)
    case "min":
      return Math.min(...nums)
    case "avg":
      return nums.reduce((a, b) => a + b, 0) / nums.length
    default:
      return null
  }
}

function runNotNull({ table, rows, columnNames, partitionColumn, granularity, lookbackDays, limit }) {
  const filtered = filterByLookback(rows, partitionColumn, lookbackDays)
  const groups = groupByPeriod(filtered, partitionColumn, granularity)
  const results = []
  for (const columnName of columnNames) {
    for (const [period, groupRows] of groups) {
      const nullCount = groupRows.filter((r) => isBlank(r[columnName])).length
      const totalRows = groupRows.length
      results.push({
        table_name: table,
        period,
        rule_name: "not_null",
        column_name: columnName,
        null_count: nullCount,
        total_rows: totalRows,
        rate_pct: totalRows ? round2((100 * (totalRows - nullCount)) / totalRows) : 0,
        status: nullCount === 0 ? "PASS" : "FAIL",
      })
    }
  }
  return applyLimit(sortByPeriodDesc(results), limit)
}

// Expected-count lookup for the derived reference modes (null = no reference).
function derivedReference(mode, counts, index) {
  switch (mode) {
    case "history":
      return Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)
    case "max_value":
      return Math.max(...counts)
    case "min_value":
      return Math.min(...counts)
    case "last_day":
      return index > 0 ? counts[index - 1] : null
    default:
      return null
  }
}

function runCountRow({ table, rows, partitionColumn, granularity, lookbackDays, limit, reference, referenceMode }) {
  const filtered = filterByLookback(rows, partitionColumn, lookbackDays)
  const groups = groupByPeriod(filtered, partitionColumn, granularity)
  const ref = String(reference ?? "").trim()
  const derived = referenceMode && referenceMode !== "custom"
  // Chronological counts — "last day" needs the previous period's count.
  const ordered = [...groups].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const counts = ordered.map(([, groupRows]) => groupRows.length)
  const results = []
  ordered.forEach(([period], i) => {
    const count = counts[i]
    let status = "PASS"
    let referenceValue = null
    let rate = null
    if (derived) {
      referenceValue = derivedReference(referenceMode, counts, i)
    } else if (ref && /^-?\d+$/.test(ref)) {
      referenceValue = Number(ref)
    }
    if (referenceValue !== null) {
      rate = referenceValue ? round2((100 * count) / referenceValue) : null
      status = count >= referenceValue * 0.98 && count <= referenceValue * 1.05 ? "PASS" : "FAIL"
    }
    results.push({
      table_name: table,
      period,
      rule_name: "count_row",
      count_row: count,
      reference: referenceValue,
      rate,
      status,
    })
  })
  return applyLimit(sortByPeriodDesc(results), limit)
}

function runMissingKey({ table, rows, columnNames, references, partitionColumn, granularity, lookbackDays, limit }) {
  const filtered = filterByLookback(rows, partitionColumn, lookbackDays)
  const groups = groupByPeriod(filtered, partitionColumn, granularity)
  const results = []
  columnNames.forEach((columnName, i) => {
    const ref = String(references?.[i] ?? "").trim()
    for (const [period, groupRows] of groups) {
      const keyCount = new Set(groupRows.map((r) => r[columnName])).size
      let status = "PASS"
      let referenceValue = null
      if (ref && /^-?\d+$/.test(ref)) {
        referenceValue = Number(ref)
        status = keyCount === referenceValue ? "PASS" : "FAIL"
      }
      results.push({
        table_name: table,
        period,
        rule_name: "missing_key",
        column_name: columnName,
        key_count: keyCount,
        reference: referenceValue,
        status,
      })
    }
  })
  return applyLimit(sortByPeriodDesc(results), limit)
}

function runMissingPeriod({ table, rows, partitionColumn, granularity, lookbackDays, limit }) {
  const expected = EXPECTED_PERIODS_PER_DAY[granularity]
  if (!expected) throw new Error(`Unsupported granularity for missing_period: ${granularity}`)

  const filtered = filterByLookback(rows, partitionColumn, lookbackDays)
  const dayGroups = groupByPeriod(filtered, partitionColumn, "daily")
  const results = []
  for (const [period, groupRows] of dayGroups) {
    const distinctBuckets = new Set(groupRows.map((r) => periodLabel(r[partitionColumn], granularity))).size
    results.push({
      table_name: table,
      period,
      rule_name: "missing_period",
      count_period: distinctBuckets,
      missing_period: expected - distinctBuckets,
      rate: round2((100 * distinctBuckets) / expected),
      status: distinctBuckets === expected ? "PASS" : "FAIL",
    })
  }
  return applyLimit(sortByPeriodDesc(results), limit)
}

function runTimeliness({ table, rows, partitionColumn, insertTimeColumn, granularity, lookbackDays, limit }) {
  if (!insertTimeColumn) throw new Error("Insert time column is required for timeliness")
  const filtered = filterByLookback(rows, partitionColumn, lookbackDays)
  const groups = groupByPeriod(filtered, partitionColumn, granularity)
  const results = []
  for (const [period, groupRows] of groups) {
    const times = groupRows.map((r) => new Date(r[insertTimeColumn]).getTime()).filter((t) => !Number.isNaN(t))
    results.push({
      table_name: table,
      period,
      rule_name: "timeliness",
      first_insert: times.length ? new Date(Math.min(...times)).toISOString().replace("T", " ").slice(0, 16) : null,
      last_insert: times.length ? new Date(Math.max(...times)).toISOString().replace("T", " ").slice(0, 16) : null,
      status: null,
    })
  }
  return applyLimit(sortByPeriodDesc(results), limit)
}

function runValidityColumn({ table, rows, columnNames, partitionColumn, granularity, lookbackDays, limit }) {
  const filtered = filterByLookback(rows, partitionColumn, lookbackDays)
  const groups = groupByPeriod(filtered, partitionColumn, granularity)
  const results = []
  for (const columnName of columnNames) {
    for (const [period, groupRows] of groups) {
      const blank = groupRows.filter((r) => String(r[columnName] ?? "").trim() === "").length
      const total = groupRows.length
      results.push({
        table_name: table,
        period,
        rule_name: "validity_column",
        column_name: columnName,
        key_count: total - blank,
        total_row: total,
        delta: blank,
        rate_pct: total ? round2((100 * (total - blank)) / total) : 0,
        status: blank === 0 ? "PASS" : "FAIL",
      })
    }
  }
  return applyLimit(sortByPeriodDesc(results), limit)
}

function runRangeCheck({ table, rows, columnNames, mins, maxs, partitionColumn, granularity, lookbackDays, limit }) {
  const filtered = filterByLookback(rows, partitionColumn, lookbackDays)
  const groups = groupByPeriod(filtered, partitionColumn, granularity)
  const results = []
  columnNames.forEach((columnName, i) => {
    const min = mins?.[i] !== "" && mins?.[i] !== undefined ? Number(mins[i]) : null
    const max = maxs?.[i] !== "" && maxs?.[i] !== undefined ? Number(maxs[i]) : null
    for (const [period, groupRows] of groups) {
      const outOfRange = groupRows.filter((r) => {
        const v = Number(r[columnName])
        if (Number.isNaN(v)) return false
        return (min !== null && v < min) || (max !== null && v > max)
      }).length
      const total = groupRows.length
      results.push({
        table_name: table,
        period,
        rule_name: "range_check",
        column_name: columnName,
        out_of_range_count: outOfRange,
        total_rows: total,
        rate_pct: total ? round2((100 * (total - outOfRange)) / total) : 0,
        status: outOfRange === 0 ? "PASS" : "FAIL",
      })
    }
  })
  return applyLimit(sortByPeriodDesc(results), limit)
}

function runPatternCheck({ table, rows, columnNames, patterns, partitionColumn, granularity, lookbackDays, limit }) {
  const filtered = filterByLookback(rows, partitionColumn, lookbackDays)
  const groups = groupByPeriod(filtered, partitionColumn, granularity)
  const results = []
  columnNames.forEach((columnName, i) => {
    const pattern = String(patterns?.[i] ?? "").trim()
    let regex = null
    try {
      regex = pattern ? new RegExp(pattern) : null
    } catch {
      regex = null
    }
    for (const [period, groupRows] of groups) {
      const match = regex ? groupRows.filter((r) => regex.test(String(r[columnName] ?? ""))).length : 0
      const total = groupRows.length
      results.push({
        table_name: table,
        period,
        rule_name: "pattern_check",
        column_name: columnName,
        match_pattern: match,
        total_row: total,
        delta: total - match,
        rate: total ? round2((100 * match) / total) : 0,
        status: total - match === 0 ? "PASS" : "FAIL",
      })
    }
  })
  return applyLimit(sortByPeriodDesc(results), limit)
}

function runAllowedValues({ table, rows, columnNames, allowedValuesLists, partitionColumn, granularity, lookbackDays, limit }) {
  const filtered = filterByLookback(rows, partitionColumn, lookbackDays)
  const groups = groupByPeriod(filtered, partitionColumn, granularity)
  const results = []
  columnNames.forEach((columnName, i) => {
    const allowed = new Set((allowedValuesLists?.[i] || []).map((v) => String(v)))
    for (const [period, groupRows] of groups) {
      const invalid = groupRows.filter((r) => !allowed.has(String(r[columnName]))).length
      const total = groupRows.length
      results.push({
        table_name: table,
        period,
        rule_name: "allowed_values",
        column_name: columnName,
        invalid_count: invalid,
        total_rows: total,
        rate_pct: total ? round2((100 * (total - invalid)) / total) : 0,
        status: invalid === 0 ? "PASS" : "FAIL",
      })
    }
  })
  return applyLimit(sortByPeriodDesc(results), limit)
}

function runConsistencyKey({
  table,
  rows,
  partitionColumn,
  keyColumn,
  controlTable,
  controlRows,
  controlPartitionColumn,
  controlKeyColumn,
  mode,
  granularity,
  lookbackDays,
  limit,
}) {
  const mainFiltered = filterByLookback(rows, partitionColumn, lookbackDays)
  const controlFiltered = filterByLookback(controlRows, controlPartitionColumn, lookbackDays)
  const mainGroups = groupByPeriod(mainFiltered, partitionColumn, granularity)
  const controlGroups = groupByPeriod(controlFiltered, controlPartitionColumn, granularity)

  if (mode === "detail") {
    const results = []
    for (const [period, groupRows] of mainGroups) {
      const controlKeys = new Set((controlGroups.get(period) || []).map((r) => r[controlKeyColumn]))
      const mainKeys = new Set(groupRows.map((r) => r[keyColumn]))
      for (const keyValue of mainKeys) {
        if (!controlKeys.has(keyValue)) results.push({ period, key_value: keyValue })
      }
    }
    return applyLimit(sortByPeriodDesc(results), limit)
  }

  const results = []
  for (const [period, groupRows] of mainGroups) {
    const controlKeys = new Set((controlGroups.get(period) || []).map((r) => r[controlKeyColumn]))
    const mainKeys = [...new Set(groupRows.map((r) => r[keyColumn]))]
    const missingCount = mainKeys.filter((k) => !controlKeys.has(k)).length
    const keyCount = mainKeys.length
    results.push({
      table_name: table,
      control_table: controlTable,
      period,
      key_count: keyCount,
      missing_count: missingCount,
      rate: keyCount ? round2((100 * (keyCount - missingCount)) / keyCount) : 0,
      status: missingCount === 0 ? "PASS" : "FAIL",
    })
  }
  return applyLimit(sortByPeriodDesc(results), limit)
}

function runConsistencyValue({
  table,
  rows,
  partitionColumn,
  metricColumn,
  aggFunc,
  controlTable,
  controlRows,
  controlPartitionColumn,
  controlMetricColumn,
  granularity,
  lookbackDays,
  limit,
}) {
  const mainFiltered = filterByLookback(rows, partitionColumn, lookbackDays)
  const controlFiltered = filterByLookback(controlRows, controlPartitionColumn, lookbackDays)
  const mainGroups = groupByPeriod(mainFiltered, partitionColumn, granularity)
  const controlGroups = groupByPeriod(controlFiltered, controlPartitionColumn, granularity)

  const results = []
  for (const [period, groupRows] of mainGroups) {
    const valueA = aggregate(
      groupRows.map((r) => r[metricColumn]),
      aggFunc
    )
    const controlRowsForPeriod = controlGroups.get(period) || []
    const valueB = aggregate(
      controlRowsForPeriod.map((r) => r[controlMetricColumn]),
      aggFunc
    )
    let deltaPct = null
    let status = "FAIL"
    if (valueA !== null && valueB) {
      deltaPct = round2((Math.abs(valueA - valueB) / valueB) * 100)
      status = deltaPct <= 1 ? "PASS" : "FAIL"
    }
    results.push({
      table_name: table,
      control_table: controlTable,
      period,
      column_name: metricColumn,
      agg_main: round2(valueA),
      agg_control: round2(valueB),
      delta: valueA !== null && valueB !== null ? round2(valueA - valueB) : null,
      delta_pct: deltaPct,
      status,
    })
  }
  return applyLimit(sortByPeriodDesc(results), limit)
}

function runUniquenessKey({
  table,
  rows,
  columnNames,
  partitionColumn,
  controlTable,
  controlRows,
  controlColumnNames,
  controlPartitionColumn,
  granularity,
  lookbackDays,
  limit,
}) {
  const mainFiltered = filterByLookback(rows, partitionColumn, lookbackDays)
  const controlFiltered = filterByLookback(controlRows, controlPartitionColumn, lookbackDays)
  const mainGroups = groupByPeriod(mainFiltered, partitionColumn, granularity)
  const controlGroups = groupByPeriod(controlFiltered, controlPartitionColumn, granularity)

  const compositeKey = (row, cols) => cols.map((c) => String(row[c] ?? "")).join("_")

  const results = []
  for (const [period, groupRows] of mainGroups) {
    const keys = groupRows.map((r) => compositeKey(r, columnNames))
    const distinctKeys = new Set(keys)
    const controlKeys = new Set(
      (controlGroups.get(period) || []).map((r) => compositeKey(r, controlColumnNames))
    )
    const missingCount = [...distinctKeys].filter((k) => !controlKeys.has(k)).length
    const totalRows = keys.length
    const distinctCount = distinctKeys.size
    results.push({
      table_name: table,
      control_table: controlTable,
      period,
      total_rows: totalRows,
      distinct_count: distinctCount,
      duplicate_count: totalRows - distinctCount,
      missing_count: missingCount,
      rate: totalRows ? round2((100 * distinctCount) / totalRows) : 0,
      status: totalRows === distinctCount && missingCount === 0 ? "PASS" : "FAIL",
    })
  }
  return applyLimit(sortByPeriodDesc(results), limit)
}

// config mirrors buildRuleQuery's config, plus `rows`/`controlRows` (the
// mock row arrays for the main/control table).
export function runRuleAnalysis(config) {
  switch (config.ruleType) {
    case "not_null":
      return runNotNull(config)
    case "count_row":
      return runCountRow(config)
    case "missing_key":
      return runMissingKey(config)
    case "missing_period":
      return runMissingPeriod(config)
    case "timeliness":
      return runTimeliness(config)
    case "validity_column":
      return runValidityColumn(config)
    case "range_check":
      return runRangeCheck(config)
    case "pattern_check":
      return runPatternCheck(config)
    case "allowed_values":
      return runAllowedValues(config)
    case "consistency_key":
      return runConsistencyKey(config)
    case "consistency_value":
      return runConsistencyValue(config)
    case "uniqueness_key":
      return runUniquenessKey(config)
    default:
      throw new Error(`Unsupported rule_type: ${config.ruleType}`)
  }
}
