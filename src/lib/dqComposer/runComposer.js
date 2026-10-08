// Mock engine for the Rules Management > Add New Rule "Composer" builder
// (Single Column / Multiple Column). Numerator/Denominator are freeform SQL
// text typed by the user (e.g. "count()", "count() - count(case when site_id
// is null then 1 else 0 end)") — this is a deliberately small interpreter
// that recognizes the handful of forms the real Composer demo uses, not a
// general SQL engine. Anything it can't recognize falls back to a plain row
// count so the prototype never hard-fails on unfamiliar formula text.

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
  if (granularity === "hourly") return `${y}-${mo}-${d} ${pad(date.getHours())}:00`
  return `${y}-${mo}-${d}`
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

function groupByJoinKey(periodGroups, joinColumns) {
  const result = new Map()
  for (const [period, groupRows] of periodGroups) {
    const sub = new Map()
    for (const row of groupRows) {
      const key = joinColumns?.length ? joinColumns.map((c) => String(row[c] ?? "")).join("_") : "__all__"
      if (!sub.has(key)) sub.set(key, [])
      sub.get(key).push(row)
    }
    result.set(period, sub)
  }
  return result
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

const NULL_CASE_RE = /^count\(\s*case\s+when\s+(\w+)\s+is\s+null\s+then\s+1\s+else\s+0\s+end\s*\)$/i
const COMPOUND_RE = /^count\(\)\s*([+-])\s*count\(\s*case\s+when\s+(\w+)\s+is\s+null\s+then\s+1\s+else\s+0\s+end\s*\)$/i

// Recognizes: count() | count(case when <col> is null then 1 else 0 end) |
// count() {+|-} count(case when <col> is null then 1 else 0 end)
export function evaluateFormula(formula, groupRows) {
  const text = String(formula ?? "").trim()
  if (!text) return null

  if (/^count\(\)$/i.test(text)) return groupRows.length

  const nullCaseMatch = text.match(NULL_CASE_RE)
  if (nullCaseMatch) {
    const [, column] = nullCaseMatch
    return groupRows.filter((r) => isBlank(r[column])).length
  }

  const compoundMatch = text.match(COMPOUND_RE)
  if (compoundMatch) {
    const [, op, column] = compoundMatch
    const nullCount = groupRows.filter((r) => isBlank(r[column])).length
    return op === "-" ? groupRows.length - nullCount : groupRows.length + nullCount
  }

  // Unrecognized formula text — fall back to a plain row count rather than
  // failing the whole preview.
  return groupRows.length
}

// config: { mode: "single"|"multiple", table, rows, partitionColumn,
//   granularity, lookbackDays, limit, ruleName, numerator, denominator,
//   joinColumnsA, controlTable, controlRows, controlPartitionColumn,
//   joinColumnsB }
export function runComposerRule(config) {
  const {
    mode,
    table,
    rows,
    partitionColumn,
    granularity,
    lookbackDays,
    limit,
    ruleName,
    numerator,
    denominator,
  } = config
  const name = String(ruleName ?? "").trim() || "custom_rule"

  const filteredA = filterByLookback(rows, partitionColumn, lookbackDays)
  const groupsA = groupByPeriod(filteredA, partitionColumn, granularity)

  if (mode !== "multiple") {
    const results = []
    for (const [period, groupRows] of groupsA) {
      const numeratorValue = evaluateFormula(numerator, groupRows)
      const denominatorText = String(denominator ?? "").trim()
      const denominatorValue = denominatorText ? evaluateFormula(denominatorText, groupRows) : null
      const ratePct = denominatorValue ? round2((100 * numeratorValue) / denominatorValue) : null
      const status = denominatorValue ? (numeratorValue === denominatorValue ? "PASS" : "FAIL") : "PASS"
      results.push({
        table_name: table,
        period,
        rule_name: name,
        numerator: numeratorValue,
        denominator: denominatorValue,
        rate_pct: ratePct,
        status,
      })
    }
    return applyLimit(sortByPeriodDesc(results), limit)
  }

  const { joinColumnsA, controlTable, controlRows, controlPartitionColumn, joinColumnsB } = config
  const filteredB = filterByLookback(controlRows, controlPartitionColumn, lookbackDays)
  const groupsB = groupByPeriod(filteredB, controlPartitionColumn, granularity)

  const subA = groupByJoinKey(groupsA, joinColumnsA)
  const subB = groupByJoinKey(groupsB, joinColumnsB)

  const results = []
  for (const [period, keysA] of subA) {
    const keysB = subB.get(period) || new Map()
    for (const [key, rowsA] of keysA) {
      const rowsB = keysB.get(key) || []
      const numeratorValue = evaluateFormula(numerator, rowsA)
      const denominatorValue = rowsB.length ? evaluateFormula(denominator, rowsB) : null
      const ratePct = denominatorValue ? round2((100 * numeratorValue) / denominatorValue) : null
      const status = denominatorValue !== null && numeratorValue === denominatorValue ? "PASS" : "FAIL"
      results.push({
        table_name: table,
        control_table: controlTable,
        period,
        rule_name: name,
        numerator: numeratorValue,
        denominator: denominatorValue,
        rate_pct: ratePct,
        status,
      })
    }
  }
  return applyLimit(sortByPeriodDesc(results), limit)
}

const GRANULARITY_EXPR = {
  daily: "CAST({partition_column} AS DATE)",
  hourly: "date_trunc('hour', {partition_column})",
}

function partitionExpr(partitionColumn, granularity) {
  const tpl = GRANULARITY_EXPR[granularity] || GRANULARITY_EXPR.daily
  return tpl.replace("{partition_column}", partitionColumn)
}

// Builds representative SQL text for display (not used for computation —
// runComposerRule does that directly over mock rows).
export function buildComposerQuery(config) {
  const {
    mode,
    table,
    partitionColumn,
    granularity,
    lookbackDays,
    limit,
    ruleName,
    columnName,
    numerator,
    denominator,
  } = config
  const name = String(ruleName ?? "").trim() || "custom_rule"
  const limitClause = Number(limit) ? `\nLIMIT ${limit}` : ""
  const columnLine = columnName ? `  '${columnName}' AS column_name,\n` : ""

  if (mode !== "multiple") {
    const denominatorText = String(denominator ?? "").trim()
    const denomExpr = denominatorText || "NULL"
    return `SELECT
  '${table}' AS table_name,
  ${partitionExpr(partitionColumn, granularity)} AS period,
  '${name}' AS rule_name,
${columnLine}  ${numerator || "count()"} AS numerator,
  ${denomExpr} AS denominator,
  round(100 * (${numerator || "count()"}) / NULLIF(${denomExpr}, 0), 2) AS rate_pct,
  CASE WHEN ${denomExpr} IS NULL THEN 'PASS' WHEN (${numerator || "count()"}) = (${denomExpr}) THEN 'PASS' ELSE 'FAIL' END AS status
FROM ${table}
WHERE ${partitionColumn} >= current_timestamp - INTERVAL '${lookbackDays} days'
GROUP BY period
ORDER BY period DESC${limitClause}`
  }

  const { controlTable, controlPartitionColumn, joinColumnsA, joinColumnsB } = config
  const joinKeyExprA = joinColumnsA?.length
    ? joinColumnsA.map((c) => `CAST(${c} AS VARCHAR)`).join(" || '_' || ")
    : "'__all__'"
  const joinKeyExprB = joinColumnsB?.length
    ? joinColumnsB.map((c) => `CAST(${c} AS VARCHAR)`).join(" || '_' || ")
    : "'__all__'"

  return `WITH
  a AS (
    SELECT ${partitionExpr(partitionColumn, granularity)} AS period, ${joinKeyExprA} AS join_key,
      ${numerator || "count()"} AS numerator
    FROM ${table}
    WHERE ${partitionColumn} >= current_timestamp - INTERVAL '${lookbackDays} days'
    GROUP BY period, join_key
  ),
  b AS (
    SELECT ${partitionExpr(controlPartitionColumn, granularity)} AS period, ${joinKeyExprB} AS join_key,
      ${denominator || "count()"} AS denominator
    FROM ${controlTable}
    WHERE ${controlPartitionColumn} >= current_timestamp - INTERVAL '${lookbackDays} days'
    GROUP BY period, join_key
  )
SELECT
  '${table}' AS table_name,
  '${controlTable}' AS control_table,
  a.period AS period,
  '${name}' AS rule_name,
${columnLine}  a.numerator AS numerator,
  b.denominator AS denominator,
  round(100 * a.numerator / NULLIF(b.denominator, 0), 2) AS rate_pct,
  CASE WHEN a.numerator = b.denominator THEN 'PASS' ELSE 'FAIL' END AS status
FROM a
JOIN b ON a.period = b.period AND a.join_key = b.join_key
ORDER BY a.period DESC${limitClause}`
}

// Replaces the concrete table/partition-column/column-name values in a
// generated query with the generic {table}/{control_table}/{partition_expr}/
// {column_name} placeholders used by the real payload's "Query Templater".
export function genericizeQuery(sql, { table, controlTable, partitionColumn, granularity, controlPartitionColumn, columnName }) {
  let generic = sql
  if (controlTable) generic = generic.split(controlTable).join("{control_table}")
  if (table) generic = generic.split(table).join("{table}")
  if (partitionColumn) {
    generic = generic.split(partitionExpr(partitionColumn, granularity)).join("{partition_expr}")
    generic = generic.split(partitionColumn).join("{partition_column}")
  }
  if (controlPartitionColumn) {
    generic = generic.split(partitionExpr(controlPartitionColumn, granularity)).join("{control_partition_expr}")
    generic = generic.split(controlPartitionColumn).join("{control_partition_column}")
  }
  if (columnName) generic = generic.split(`'${columnName}'`).join("{column_name}")
  return generic
}
