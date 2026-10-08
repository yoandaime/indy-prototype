// Mock "Profile Table" engine — computes the same daily-health shape as the
// reference backend's core/profiling.py (profile_table), directly over the
// in-memory mock rows instead of a real DuckDB query. Deliberately skips the
// reference's `_fetch_pipeline_activity` (randomized insert/select query
// counters) — this is static, representative mock data, not a live pipeline.

const CRITICAL_NULL_PCT_THRESHOLD = 50
const RATE_COLUMN_PATTERN = /rate$/i
const SAMPLE_ROW_LIMIT = 8

function round2(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return Math.round(value * 100) / 100
}

function dateKey(rawValue) {
  const date = new Date(rawValue)
  if (Number.isNaN(date.getTime())) return String(rawValue)
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${mo}-${d}`
}

function isBlank(value, columnType) {
  if (value === null || value === undefined) return true
  if (columnType && columnType.toLowerCase().includes("string")) return String(value) === ""
  return false
}

function groupByDay(rows, partitionColumn) {
  const groups = new Map()
  for (const row of rows) {
    const key = dateKey(row[partitionColumn])
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  return groups
}

function addDays(dayStr, delta) {
  const d = new Date(`${dayStr}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return dateKey(d)
}

export function daysBetweenInclusive(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`).getTime()
  const end = new Date(`${endDate}T00:00:00`).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.max(0, Math.round((end - start) / (24 * 3600 * 1000)) + 1)
}

function filterByDateRange(rows, partitionColumn, startDate, endDate) {
  if (!startDate && !endDate) return rows
  return rows.filter((r) => {
    const key = dateKey(r[partitionColumn])
    if (startDate && key < startDate) return false
    if (endDate && key > endDate) return false
    return true
  })
}

// Given a table's rows, returns a sensible default { startDate, endDate }
// window: the most recent `days` calendar days present in the data.
export function computeDefaultDateRange(rows, partitionColumn, days) {
  const keys = rows.map((r) => dateKey(r[partitionColumn])).filter(Boolean)
  if (!keys.length) return { startDate: "", endDate: "" }
  const endDate = keys.reduce((a, b) => (b > a ? b : a))
  const startDate = addDays(endDate, -(Number(days) - 1))
  return { startDate, endDate }
}

function combinedKey(row, uniqKeyColumns) {
  return uniqKeyColumns.map((c) => String(row[c])).join("␟")
}

function countDistinctCombo(rows, uniqKeyColumns) {
  if (!uniqKeyColumns.length) return 0
  return new Set(rows.map((r) => combinedKey(r, uniqKeyColumns))).size
}

// Derives Completeness / Uniqueness / Validity / Timeliness scores for a
// given row set. Timeliness needs the calendar window (not just the rows) so
// it can account for days with zero data.
function computeDimensionMetrics({ rows, columns, uniqKeyColumns, startDate, endDate }) {
  const dataColumns = columns.filter((c) => !c.is_period)

  let totalCells = 0
  let nullCells = 0
  for (const row of rows) {
    for (const col of dataColumns) {
      totalCells += 1
      if (isBlank(row[col.column], col.type)) nullCells += 1
    }
  }
  const completeness = totalCells > 0 ? round2(100 - (100 * nullCells) / totalCells) : 100

  let uniqueness = null
  if (uniqKeyColumns.length && rows.length) {
    uniqueness = round2((100 * countDistinctCombo(rows, uniqKeyColumns)) / rows.length)
  }

  const rateColumns = dataColumns.filter((c) => RATE_COLUMN_PATTERN.test(c.column))
  let validity = 100
  if (rateColumns.length) {
    let checked = 0
    let valid = 0
    for (const row of rows) {
      for (const col of rateColumns) {
        const v = row[col.column]
        if (v === null || v === undefined) continue
        checked += 1
        if (typeof v === "number" && v >= 0 && v <= 1) valid += 1
      }
    }
    validity = checked > 0 ? round2((100 * valid) / checked) : 100
  }

  const windowDays = daysBetweenInclusive(startDate, endDate) || 1
  const daysWithData = groupByDay(rows, "__day__").size
  const timeliness = round2((100 * Math.min(daysWithData, windowDays)) / windowDays)

  return { completeness, uniqueness, validity, timeliness }
}

// table: display name string. rows: mock row objects. columns: [{column, type, is_period}]
export function profileTable({
  table,
  rows,
  columns,
  partitionColumn,
  insertTimeColumn = "",
  uniqKeyColumns = [],
  startDate = "",
  endDate = "",
}) {
  const rowsWithDay = rows.map((r) => ({ ...r, __day__: dateKey(r[partitionColumn]) }))
  const filtered = filterByDateRange(rowsWithDay, "__day__", startDate, endDate)
  const dayGroups = groupByDay(filtered, "__day__")
  const keyCheckColumns = uniqKeyColumns.filter((c) => c !== partitionColumn)

  const resolvedStart = startDate || (filtered.length ? filtered.reduce((a, r) => (r.__day__ < a ? r.__day__ : a), filtered[0].__day__) : "")
  const resolvedEnd = endDate || (filtered.length ? filtered.reduce((a, r) => (r.__day__ > a ? r.__day__ : a), filtered[0].__day__) : "")
  const windowDays = daysBetweenInclusive(resolvedStart, resolvedEnd) || dayGroups.size || 1

  // Fill in gap days (present in the window but with zero rows) so the daily
  // table / trend chart show them explicitly instead of being skipped.
  const allDayKeys = new Set(dayGroups.keys())
  if (resolvedStart && resolvedEnd) {
    for (let i = 0; i < windowDays; i += 1) allDayKeys.add(addDays(resolvedStart, i))
  }

  const daily = [...allDayKeys]
    .map((date) => {
      const groupRows = dayGroups.get(date) || []
      const profile = {}
      for (const col of columns) {
        const nullCount = groupRows.filter((r) => isBlank(r[col.column], col.type)).length
        profile[col.column] = { n: nullCount, nn: groupRows.length - nullCount }
      }

      const keyProfile = {}
      for (const col of keyCheckColumns) {
        keyProfile[col] = new Set(groupRows.map((r) => r[col])).size
      }

      const insertTimes = insertTimeColumn
        ? groupRows.map((r) => new Date(r[insertTimeColumn]).getTime()).filter((t) => !Number.isNaN(t))
        : []

      return {
        date,
        first_insert: insertTimes.length ? new Date(Math.min(...insertTimes)).toISOString().replace("T", " ").slice(0, 19) : "N/A",
        last_insert: insertTimes.length ? new Date(Math.max(...insertTimes)).toISOString().replace("T", " ").slice(0, 19) : "N/A",
        rows: groupRows.length,
        uniq: countDistinctCombo(groupRows, uniqKeyColumns),
        profile,
        key_profile: keyProfile,
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  const dataDays = daily.filter((d) => d.rows > 0)
  const gapDays = daily.filter((d) => d.rows === 0).map((d) => d.date)

  const dailySummary = daily.map((d) => ({
    date: d.date,
    first_insert: d.rows === 0 ? "N/A" : d.first_insert,
    last_insert: d.rows === 0 ? "N/A" : d.last_insert,
    rows: d.rows,
    uniq: d.uniq,
    is_gap: d.rows === 0,
  }))

  let keyUniqCompare = []
  if (keyCheckColumns.length) {
    const chronological = [...daily].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    const prevUniq = {}
    const entries = chronological.map((d) => {
      const entry = { date: d.date }
      for (const col of keyCheckColumns) {
        if (d.rows === 0) {
          entry[col] = null
          continue
        }
        const uniq = d.key_profile[col] ?? 0
        const compare = col in prevUniq ? uniq - prevUniq[col] : 0
        entry[col] = { uniq, isConsistent: compare === 0 }
        prevUniq[col] = uniq
      }
      return entry
    })
    keyUniqCompare = entries.reverse()
  }

  const allCols = dataDays.length ? Object.keys(dataDays[0].profile) : []

  // Min/max are only meaningful for numeric columns — computed from the raw
  // filtered rows rather than the day-grouped profile above.
  function numericRange(col) {
    let min = null
    let max = null
    for (const row of filtered) {
      const v = row[col]
      if (typeof v !== "number" || Number.isNaN(v)) continue
      if (min === null || v < min) min = v
      if (max === null || v > max) max = v
    }
    return { min: min === null ? null : round2(min), max: max === null ? null : round2(max) }
  }

  const columnTypes = new Map(columns.map((c) => [c.column, c.type]))

  const consistentNull = allCols.map((col) => {
    const dailyPct = []
    let daysNull = 0
    for (const d of dataDays) {
      const v = d.profile[col] || { n: 0, nn: 0 }
      const rowTotal = v.n + v.nn
      const pct = rowTotal ? (100 * v.n) / rowTotal : 0
      dailyPct.push(pct)
      if (v.n > 0) daysNull += 1
    }

    const avgNullPct = dailyPct.length ? round2(dailyPct.reduce((a, b) => a + b, 0) / dailyPct.length) : 0
    const isAlwaysNull = dailyPct.length > 0 && dailyPct.every((pct) => pct === 100)

    let severity
    if (avgNullPct <= 0) severity = "CLEAN"
    else if (isAlwaysNull) severity = "ALWAYS_NULL"
    else if (avgNullPct >= CRITICAL_NULL_PCT_THRESHOLD) severity = "CRITICAL"
    else severity = "WATCH"

    const { min, max } = numericRange(col)

    return {
      column: col,
      column_type: columnTypes.get(col) ?? "—",
      avg_null_pct: avgNullPct,
      severity,
      days_null: daysNull,
      days_total: daily.length,
      min_value: min,
      max_value: max,
    }
  })

  const severityOrder = { ALWAYS_NULL: 0, CRITICAL: 1, WATCH: 2, CLEAN: 3 }
  consistentNull.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.avg_null_pct - a.avg_null_pct)

  const nullDays = daily.filter((d) => Object.values(d.profile).some((v) => v.n > 0)).length

  // Dimension scorecards (Completeness / Uniqueness / Validity / Timeliness),
  // each compared against the immediately preceding window of equal length.
  const metrics = computeDimensionMetrics({
    rows: filtered,
    columns,
    uniqKeyColumns,
    startDate: resolvedStart,
    endDate: resolvedEnd,
  })

  let prevMetrics = null
  if (resolvedStart && resolvedEnd) {
    const prevEnd = addDays(resolvedStart, -1)
    const prevStart = addDays(prevEnd, -(windowDays - 1))
    const prevRows = filterByDateRange(rowsWithDay, "__day__", prevStart, prevEnd)
    prevMetrics = computeDimensionMetrics({
      rows: prevRows,
      columns,
      uniqKeyColumns,
      startDate: prevStart,
      endDate: prevEnd,
    })
  }

  const dimensions = ["completeness", "uniqueness", "validity", "timeliness"].map((key) => {
    const value = metrics[key]
    const prevValue = prevMetrics ? prevMetrics[key] : null
    const delta = value !== null && prevValue !== null ? round2(value - prevValue) : null
    return { key, value, delta }
  })

  const insertTimesAll = filtered
    .map((r) => (insertTimeColumn ? new Date(r[insertTimeColumn]).getTime() : NaN))
    .filter((t) => !Number.isNaN(t))
  const lastInsertQuery = insertTimesAll.length
    ? new Date(Math.max(...insertTimesAll)).toISOString().replace("T", " ").slice(0, 19)
    : "N/A"

  const sample = filtered.slice(0, SAMPLE_ROW_LIMIT).map((r) => {
    const { __day__, ...rest } = r
    return rest
  })

  return {
    table,
    period: partitionColumn,
    insertTimeColumn,
    uniqKeyColumns,
    dateRange: { startDate: resolvedStart, endDate: resolvedEnd },
    lastInsertQuery,
    dimensions,
    daily: dailySummary,
    sample,
    keyUniqCompare,
    keyCheckColumns,
    consistentNull,
    summary: {
      total_rows: daily.reduce((sum, d) => sum + d.rows, 0),
      avg_rows: daily.length ? round2(daily.reduce((sum, d) => sum + d.rows, 0) / daily.length) : 0,
      days_with_data: daily.length - gapDays.length,
      days_total: daily.length,
      gap_days: gapDays.length,
      null_days: nullDays,
    },
  }
}
