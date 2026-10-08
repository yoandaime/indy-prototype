// SQL text generator — ported 1:1 from the reference backend's
// core/rules.py so the generated query text matches the real tool exactly.
// This only builds query STRINGS for display; src/lib/dqComposer/runAnalysis.js
// does the actual mock computation for the "Run Analysis" step.

import {
  MAX_NOT_NULL_COLUMNS,
  MAX_MISSING_KEY_COLUMNS,
  EXPECTED_PERIODS_PER_DAY,
  MISSING_PERIOD_GRANULARITIES,
  CONSISTENCY_KEY_MODES,
  CONSISTENCY_VALUE_AGGREGATIONS,
} from "./constants"

const GRANULARITY_EXPR = {
  five_minutely: "time_bucket(INTERVAL '5 minutes', {partition_column})",
  quarter_hourly: "time_bucket(INTERVAL '15 minutes', {partition_column})",
  hourly: "date_trunc('hour', {partition_column})",
  daily: "CAST({partition_column} AS DATE)",
  weekly: "date_trunc('week', {partition_column})",
  monthly: "date_trunc('month', {partition_column})",
}

function fmt(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing template value: ${key}`)
    return values[key]
  })
}

function resolvePartitionExpr(partitionColumn, granularity) {
  const template = GRANULARITY_EXPR[granularity]
  if (!template) throw new Error(`Unsupported granularity: ${granularity}`)
  return template.replace("{partition_column}", partitionColumn)
}

function resolveLimitClause(limit) {
  if (Number(limit) === 0) return ""
  return `\nLIMIT ${limit}`
}

const NOT_NULL_BLOCK = `SELECT
  '{table}' AS table_name,
  {partition_expr} AS period,
  'not_null' AS rule_name,
  '{column_name}' AS column_name,
  count(*) FILTER (WHERE {column_name} IS NULL OR trim(CAST({column_name} AS VARCHAR)) = '') AS null_count,
  count(*) AS total_rows,
  round(100 * (count(*) - count(*) FILTER (WHERE {column_name} IS NULL OR trim(CAST({column_name} AS VARCHAR)) = '')) / count(*), 2) AS rate_pct,
  CASE WHEN count(*) FILTER (WHERE {column_name} IS NULL OR trim(CAST({column_name} AS VARCHAR)) = '') = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM {table}
WHERE {partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
GROUP BY period`

const COUNT_ROW_TEMPLATE = `SELECT
  '{table}' AS table_name,
  {partition_expr} AS period,
  'count_row' AS rule_name,
  count(*) AS count_row,
  {denum} AS reference,
  round(100 * count(*) / {rate_denom}, 2) AS rate,
  {status_expr} AS status
FROM {table}
WHERE {partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
GROUP BY period
ORDER BY period DESC{limit_clause}`

const MISSING_KEY_BLOCK = `SELECT
  '{table}' AS table_name,
  {partition_expr} AS period,
  'missing_key' AS rule_name,
  '{column_name}' AS column_name,
  count(DISTINCT {column_name}) AS key_count,
  {reference} AS reference,
  {status_expr} AS status
FROM {table}
WHERE {partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
GROUP BY period`

const MISSING_PERIOD_TEMPLATE = `SELECT
  '{table}' AS table_name,
  CAST({partition_column} AS DATE) AS period,
  'missing_period' AS rule_name,
  count(DISTINCT {granularity_expr}) AS count_period,
  {expected} - count(DISTINCT {granularity_expr}) AS missing_period,
  round(100 * count(DISTINCT {granularity_expr}) / {expected}, 2) AS rate,
  CASE WHEN count(DISTINCT {granularity_expr}) = {expected} THEN 'PASS' ELSE 'FAIL' END AS status
FROM {table}
WHERE {partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
GROUP BY period
ORDER BY period DESC{limit_clause}`

const TIMELINESS_TEMPLATE = `SELECT
  '{table}' AS table_name,
  {partition_expr} AS period,
  'timeliness' AS rule_name,
  min({insert_time_column}) AS first_insert,
  max({insert_time_column}) AS last_insert,
  NULL AS status
FROM {table}
WHERE {partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
GROUP BY period
ORDER BY period DESC{limit_clause}`

const VALIDITY_COLUMN_BLOCK = `SELECT
  '{table}' AS table_name,
  {partition_expr} AS period,
  'validity_column' AS rule_name,
  '{column_name}' AS column_name,
  count(*) - count(*) FILTER (WHERE trim(CAST({column_name} AS VARCHAR)) = '') AS key_count,
  count(*) AS total_row,
  count(*) FILTER (WHERE trim(CAST({column_name} AS VARCHAR)) = '') AS delta,
  round(100 * (count(*) - count(*) FILTER (WHERE trim(CAST({column_name} AS VARCHAR)) = '')) / count(*), 2) AS rate_pct,
  CASE WHEN count(*) FILTER (WHERE trim(CAST({column_name} AS VARCHAR)) = '') = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM {table}
WHERE {partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
GROUP BY period`

const RANGE_CHECK_BLOCK = `SELECT
  '{table}' AS table_name,
  {partition_expr} AS period,
  'range_check' AS rule_name,
  '{column_name}' AS column_name,
  count(*) FILTER (WHERE {range_condition}) AS out_of_range_count,
  count(*) AS total_rows,
  round(100 * (count(*) - count(*) FILTER (WHERE {range_condition})) / count(*), 2) AS rate_pct,
  CASE WHEN count(*) FILTER (WHERE {range_condition}) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM {table}
WHERE {partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
GROUP BY period`

const PATTERN_CHECK_BLOCK = `SELECT
  '{table}' AS table_name,
  {partition_expr} AS period,
  'pattern_check' AS rule_name,
  '{column_name}' AS column_name,
  count(*) FILTER (WHERE regexp_matches(CAST({column_name} AS VARCHAR), '{pattern}')) AS match_pattern,
  count(*) AS total_row,
  count(*) FILTER (WHERE NOT regexp_matches(CAST({column_name} AS VARCHAR), '{pattern}')) AS delta,
  round(100 * count(*) FILTER (WHERE regexp_matches(CAST({column_name} AS VARCHAR), '{pattern}')) / count(*), 2) AS rate,
  CASE WHEN count(*) FILTER (WHERE NOT regexp_matches(CAST({column_name} AS VARCHAR), '{pattern}')) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM {table}
WHERE {partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
GROUP BY period`

const ALLOWED_VALUES_BLOCK = `SELECT
  '{table}' AS table_name,
  {partition_expr} AS period,
  'allowed_values' AS rule_name,
  '{column_name}' AS column_name,
  count(*) FILTER (WHERE CAST({column_name} AS VARCHAR) NOT IN ({values_list})) AS invalid_count,
  count(*) AS total_rows,
  round(100 * (count(*) - count(*) FILTER (WHERE CAST({column_name} AS VARCHAR) NOT IN ({values_list}))) / count(*), 2) AS rate_pct,
  CASE WHEN count(*) FILTER (WHERE CAST({column_name} AS VARCHAR) NOT IN ({values_list})) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM {table}
WHERE {partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
GROUP BY period`

const CONSISTENCY_KEY_CTE = `WITH
  main_keys AS (
    SELECT {main_period_expr} AS period, {main_key_column} AS key_value
    FROM {table}
    WHERE {main_partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
    GROUP BY period, key_value
  ),
  control_keys AS (
    SELECT {control_period_expr} AS period, {control_key_column} AS key_value
    FROM {control_table}
    WHERE {control_partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
    GROUP BY period, key_value
  )
`

const CONSISTENCY_KEY_SUMMARY_TEMPLATE =
  CONSISTENCY_KEY_CTE +
  `SELECT
  '{table}' AS table_name,
  '{control_table}' AS control_table,
  m.period AS period,
  count(*) AS key_count,
  count(*) FILTER (WHERE c.key_value IS NULL) AS missing_count,
  round(100 * (count(*) - count(*) FILTER (WHERE c.key_value IS NULL)) / count(*), 2) AS rate,
  CASE WHEN count(*) FILTER (WHERE c.key_value IS NULL) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM main_keys m
LEFT JOIN control_keys c ON m.period = c.period AND m.key_value = c.key_value
GROUP BY m.period
ORDER BY m.period DESC{limit_clause}`

const CONSISTENCY_KEY_DETAIL_TEMPLATE =
  CONSISTENCY_KEY_CTE +
  `SELECT
  m.period AS period,
  m.key_value AS key_value
FROM main_keys m
LEFT JOIN control_keys c ON m.period = c.period AND m.key_value = c.key_value
WHERE c.key_value IS NULL
ORDER BY m.period DESC, m.key_value{limit_clause}`

const CONSISTENCY_VALUE_TEMPLATE = `WITH
  main_agg AS (
    SELECT {main_period_expr} AS period, {agg_func}({main_metric_column}) AS value_a
    FROM {table}
    WHERE {main_partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
    GROUP BY period
  ),
  control_agg AS (
    SELECT {control_period_expr} AS period, {agg_func}({control_metric_column}) AS value_b
    FROM {control_table}
    WHERE {control_partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
    GROUP BY period
  )
SELECT
  '{table}' AS table_name,
  '{control_table}' AS control_table,
  m.period AS period,
  '{main_metric_column}' AS column_name,
  round(m.value_a, 2) AS agg_main,
  round(c.value_b, 2) AS agg_control,
  round(m.value_a - c.value_b, 2) AS delta,
  CASE WHEN c.value_b = 0 OR m.value_a = 0 THEN NULL ELSE round(abs(m.value_a - c.value_b) / c.value_b * 100, 2) END AS delta_pct,
  CASE
    WHEN c.value_b = 0 OR m.value_a = 0 THEN 'FAIL'
    WHEN abs(m.value_a - c.value_b) / c.value_b * 100 <= 1 THEN 'PASS'
    ELSE 'FAIL'
  END AS status
FROM main_agg m
LEFT JOIN control_agg c ON m.period = c.period
ORDER BY m.period DESC{limit_clause}`

const COUNT_DISTINCT_KEY_TEMPLATE = `WITH
  main_keys AS (
    SELECT {main_period_expr} AS period, {main_key_expr} AS key_value
    FROM {table}
    WHERE {main_partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
  ),
  main_agg AS (
    SELECT period, count(*) AS total_rows, count(DISTINCT key_value) AS distinct_count
    FROM main_keys
    GROUP BY period
  ),
  control_keys AS (
    SELECT {control_period_expr} AS period, {control_key_expr} AS key_value
    FROM {control_table}
    WHERE {control_partition_column} >= current_timestamp - INTERVAL '{lookback_days} days'
    GROUP BY period, key_value
  ),
  missing_agg AS (
    SELECT mk.period AS period, count(DISTINCT CASE WHEN c.key_value IS NULL THEN mk.key_value ELSE NULL END) AS missing_count
    FROM main_keys mk
    LEFT JOIN control_keys c ON mk.period = c.period AND mk.key_value = c.key_value
    GROUP BY mk.period
  )
SELECT
  '{table}' AS table_name,
  '{control_table}' AS control_table,
  m.period AS period,
  m.total_rows AS total_rows,
  m.distinct_count AS distinct_count,
  m.total_rows - m.distinct_count AS duplicate_count,
  a.missing_count AS missing_count,
  round(100 * m.distinct_count / m.total_rows, 2) AS rate,
  CASE WHEN m.total_rows = m.distinct_count AND a.missing_count = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM main_agg m
LEFT JOIN missing_agg a ON m.period = a.period
ORDER BY m.period DESC{limit_clause}`

function buildNotNullQuery({ table, columnNames, partitionColumn, granularity, lookbackDays, limit }) {
  if (!columnNames.length) throw new Error("At least one column is required for not_null")
  if (columnNames.length > MAX_NOT_NULL_COLUMNS)
    throw new Error(`Maximum ${MAX_NOT_NULL_COLUMNS} columns allowed for not_null`)

  const partitionExpr = resolvePartitionExpr(partitionColumn, granularity)
  const limitClause = resolveLimitClause(limit)

  const blocks = columnNames.map((columnName) =>
    fmt(NOT_NULL_BLOCK, {
      table,
      column_name: columnName,
      partition_expr: partitionExpr,
      partition_column: partitionColumn,
      lookback_days: lookbackDays,
    })
  )

  return blocks.join("\nUNION ALL\n") + `\nORDER BY period DESC${limitClause}`
}

// Derived references are window functions over the per-period counts.
const COUNT_ROW_REFERENCE_EXPR = {
  history: "round(avg(count_row) OVER ())",
  max_value: "max(count_row) OVER ()",
  min_value: "min(count_row) OVER ()",
  last_day: "lag(count_row) OVER (ORDER BY period)",
}

function buildDerivedCountRowQuery({ table, partitionColumn, granularity, lookbackDays, limit, referenceMode }) {
  return `WITH daily AS (
  SELECT
    '${table}' AS table_name,
    ${resolvePartitionExpr(partitionColumn, granularity)} AS period,
    'count_row' AS rule_name,
    count(*) AS count_row
  FROM ${table}
  WHERE ${partitionColumn} >= current_timestamp - INTERVAL '${lookbackDays} days'
  GROUP BY period
),
with_reference AS (
  SELECT *, ${COUNT_ROW_REFERENCE_EXPR[referenceMode]} AS reference
  FROM daily
)
SELECT
  table_name,
  period,
  rule_name,
  count_row,
  reference,
  round(100 * count_row / reference, 2) AS rate,
  CASE
    WHEN reference IS NULL THEN 'PASS'
    WHEN count_row BETWEEN reference * 0.98 AND reference * 1.05 THEN 'PASS'
    ELSE 'FAIL'
  END AS status
FROM with_reference
ORDER BY period DESC${resolveLimitClause(limit)}`
}

function buildCountRowQuery(config) {
  if (config.referenceMode && config.referenceMode !== "custom") {
    return buildDerivedCountRowQuery(config)
  }
  const { table, partitionColumn, granularity, lookbackDays, limit, reference } = config
  const ref = String(reference ?? "").trim()
  let statusExpr, denum, rateDenom
  if (ref) {
    if (!/^-?\d+$/.test(ref)) throw new Error(`Reference must be a number: ${reference}`)
    statusExpr = `CASE WHEN count(*) BETWEEN ${ref} * 0.98 AND ${ref} * 1.05 THEN 'PASS' ELSE 'FAIL' END`
    denum = ref
    rateDenom = ref
  } else {
    statusExpr = "'PASS'"
    denum = "NULL"
    rateDenom = "NULL"
  }

  return fmt(COUNT_ROW_TEMPLATE, {
    table,
    partition_expr: resolvePartitionExpr(partitionColumn, granularity),
    partition_column: partitionColumn,
    lookback_days: lookbackDays,
    limit_clause: resolveLimitClause(limit),
    status_expr: statusExpr,
    denum,
    rate_denom: rateDenom,
  })
}

function buildMissingKeyQuery({ table, columnNames, references, partitionColumn, granularity, lookbackDays, limit }) {
  if (!columnNames.length) throw new Error("At least one column is required for missing_key")
  if (columnNames.length > MAX_MISSING_KEY_COLUMNS)
    throw new Error(`Maximum ${MAX_MISSING_KEY_COLUMNS} columns allowed for missing_key`)

  const partitionExpr = resolvePartitionExpr(partitionColumn, granularity)
  const limitClause = resolveLimitClause(limit)

  const blocks = columnNames.map((columnName, i) => {
    const ref = String(references?.[i] ?? "").trim()
    let statusExpr, reference
    if (ref) {
      if (!/^-?\d+$/.test(ref)) throw new Error(`Reference must be a number: ${ref}`)
      statusExpr = `CASE WHEN count(DISTINCT ${columnName}) = ${ref} THEN 'PASS' ELSE 'FAIL' END`
      reference = ref
    } else {
      statusExpr = "'PASS'"
      reference = "NULL"
    }
    return fmt(MISSING_KEY_BLOCK, {
      table,
      column_name: columnName,
      partition_expr: partitionExpr,
      partition_column: partitionColumn,
      lookback_days: lookbackDays,
      reference,
      status_expr: statusExpr,
    })
  })

  return blocks.join("\nUNION ALL\n") + `\nORDER BY period DESC${limitClause}`
}

function buildMissingPeriodQuery({ table, partitionColumn, granularity, lookbackDays, limit }) {
  const expected = EXPECTED_PERIODS_PER_DAY[granularity]
  if (expected === undefined)
    throw new Error(
      `Unsupported granularity for missing_period: ${granularity} (allowed: ${MISSING_PERIOD_GRANULARITIES.join(", ")})`
    )

  const granularityExpr = GRANULARITY_EXPR[granularity].replace("{partition_column}", partitionColumn)

  return fmt(MISSING_PERIOD_TEMPLATE, {
    table,
    partition_column: partitionColumn,
    granularity_expr: granularityExpr,
    expected,
    lookback_days: lookbackDays,
    limit_clause: resolveLimitClause(limit),
  })
}

function buildTimelinessQuery({ table, partitionColumn, insertTimeColumn, granularity, lookbackDays, limit }) {
  if (!insertTimeColumn) throw new Error("Insert time column is required for timeliness")

  return fmt(TIMELINESS_TEMPLATE, {
    table,
    partition_expr: resolvePartitionExpr(partitionColumn, granularity),
    partition_column: partitionColumn,
    insert_time_column: insertTimeColumn,
    lookback_days: lookbackDays,
    limit_clause: resolveLimitClause(limit),
  })
}

function buildValidityColumnQuery({ table, columnNames, partitionColumn, granularity, lookbackDays, limit }) {
  if (!columnNames.length) throw new Error("At least one column is required for validity_column")

  const partitionExpr = resolvePartitionExpr(partitionColumn, granularity)
  const limitClause = resolveLimitClause(limit)

  const blocks = columnNames.map((columnName) =>
    fmt(VALIDITY_COLUMN_BLOCK, {
      table,
      column_name: columnName,
      partition_expr: partitionExpr,
      partition_column: partitionColumn,
      lookback_days: lookbackDays,
    })
  )

  return blocks.join("\nUNION ALL\n") + `\nORDER BY period DESC${limitClause}`
}

function buildRangeCheckQuery({ table, columnNames, mins, maxs, partitionColumn, granularity, lookbackDays, limit }) {
  if (!columnNames.length) throw new Error("At least one column is required for range_check")

  const partitionExpr = resolvePartitionExpr(partitionColumn, granularity)
  const limitClause = resolveLimitClause(limit)

  const blocks = columnNames.map((columnName, i) => {
    const min = String(mins?.[i] ?? "").trim()
    const max = String(maxs?.[i] ?? "").trim()
    if (!min && !max) throw new Error(`At least one of min/max is required for column: ${columnName}`)

    const conditions = []
    if (min) conditions.push(`${columnName} < ${min}`)
    if (max) conditions.push(`${columnName} > ${max}`)

    return fmt(RANGE_CHECK_BLOCK, {
      table,
      column_name: columnName,
      partition_expr: partitionExpr,
      partition_column: partitionColumn,
      lookback_days: lookbackDays,
      range_condition: conditions.join(" OR "),
    })
  })

  return blocks.join("\nUNION ALL\n") + `\nORDER BY period DESC${limitClause}`
}

function buildPatternCheckQuery({ table, columnNames, patterns, partitionColumn, granularity, lookbackDays, limit }) {
  if (!columnNames.length) throw new Error("At least one column is required for pattern_check")

  const partitionExpr = resolvePartitionExpr(partitionColumn, granularity)
  const limitClause = resolveLimitClause(limit)

  const blocks = columnNames.map((columnName, i) => {
    const pattern = String(patterns?.[i] ?? "").trim()
    if (!pattern) throw new Error(`Pattern is required for column: ${columnName}`)

    return fmt(PATTERN_CHECK_BLOCK, {
      table,
      column_name: columnName,
      partition_expr: partitionExpr,
      partition_column: partitionColumn,
      lookback_days: lookbackDays,
      pattern: pattern.replace(/'/g, "''"),
    })
  })

  return blocks.join("\nUNION ALL\n") + `\nORDER BY period DESC${limitClause}`
}

function buildAllowedValuesQuery({ table, columnNames, allowedValuesLists, partitionColumn, granularity, lookbackDays, limit }) {
  if (!columnNames.length) throw new Error("At least one column is required for allowed_values")

  const partitionExpr = resolvePartitionExpr(partitionColumn, granularity)
  const limitClause = resolveLimitClause(limit)

  const blocks = columnNames.map((columnName, i) => {
    const values = allowedValuesLists?.[i] || []
    if (!values.length) throw new Error(`At least one allowed value is required for column: ${columnName}`)

    const valuesList = values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(", ")

    return fmt(ALLOWED_VALUES_BLOCK, {
      table,
      column_name: columnName,
      partition_expr: partitionExpr,
      partition_column: partitionColumn,
      lookback_days: lookbackDays,
      values_list: valuesList,
    })
  })

  return blocks.join("\nUNION ALL\n") + `\nORDER BY period DESC${limitClause}`
}

function buildConsistencyKeyQuery({
  table,
  partitionColumn,
  keyColumn,
  controlTable,
  controlPartitionColumn,
  controlKeyColumn,
  mode,
  granularity,
  lookbackDays,
  limit,
}) {
  if (!controlTable) throw new Error("Control table is required for consistency_key")
  if (!keyColumn || !controlKeyColumn) throw new Error("Key column (both tables) is required for consistency_key")
  if (!CONSISTENCY_KEY_MODES.includes(mode))
    throw new Error(`Unsupported mode: ${mode} (allowed: ${CONSISTENCY_KEY_MODES.join(", ")})`)

  const template = mode === "summary" ? CONSISTENCY_KEY_SUMMARY_TEMPLATE : CONSISTENCY_KEY_DETAIL_TEMPLATE

  return fmt(template, {
    table,
    main_period_expr: resolvePartitionExpr(partitionColumn, granularity),
    main_key_column: keyColumn,
    main_partition_column: partitionColumn,
    control_table: controlTable,
    control_period_expr: resolvePartitionExpr(controlPartitionColumn, granularity),
    control_key_column: controlKeyColumn,
    control_partition_column: controlPartitionColumn,
    lookback_days: lookbackDays,
    limit_clause: resolveLimitClause(limit),
  })
}

function buildConsistencyValueQuery({
  table,
  partitionColumn,
  metricColumn,
  aggFunc,
  controlTable,
  controlPartitionColumn,
  controlMetricColumn,
  granularity,
  lookbackDays,
  limit,
}) {
  if (!controlTable) throw new Error("Control table is required for consistency_value")
  if (!metricColumn || !controlMetricColumn)
    throw new Error("Metric column (both tables) is required for consistency_value")
  if (!CONSISTENCY_VALUE_AGGREGATIONS.includes(aggFunc))
    throw new Error(`Unsupported aggregation: ${aggFunc} (allowed: ${CONSISTENCY_VALUE_AGGREGATIONS.join(", ")})`)

  return fmt(CONSISTENCY_VALUE_TEMPLATE, {
    table,
    main_period_expr: resolvePartitionExpr(partitionColumn, granularity),
    main_metric_column: metricColumn,
    main_partition_column: partitionColumn,
    control_table: controlTable,
    control_period_expr: resolvePartitionExpr(controlPartitionColumn, granularity),
    control_metric_column: controlMetricColumn,
    control_partition_column: controlPartitionColumn,
    agg_func: aggFunc === "count" ? "COUNT" : aggFunc,
    lookback_days: lookbackDays,
    limit_clause: resolveLimitClause(limit),
  })
}

function buildUniquenessKeyQuery({
  table,
  columnNames,
  partitionColumn,
  controlTable,
  controlColumnNames,
  controlPartitionColumn,
  granularity,
  lookbackDays,
  limit,
}) {
  if (!columnNames.length) throw new Error("At least one column is required for uniqueness_key")
  if (!controlTable) throw new Error("Control table is required for uniqueness_key")
  if (!controlColumnNames?.length) throw new Error("Key column (control table) is required for uniqueness_key")

  const mainKeyExpr = `concat(${columnNames.map((c) => `CAST(${c} AS VARCHAR)`).join(", '_', ")})`
  const controlKeyExpr = `concat(${controlColumnNames.map((c) => `CAST(${c} AS VARCHAR)`).join(", '_', ")})`

  return fmt(COUNT_DISTINCT_KEY_TEMPLATE, {
    table,
    main_period_expr: resolvePartitionExpr(partitionColumn, granularity),
    main_key_expr: mainKeyExpr,
    main_partition_column: partitionColumn,
    control_table: controlTable,
    control_period_expr: resolvePartitionExpr(controlPartitionColumn, granularity),
    control_key_expr: controlKeyExpr,
    control_partition_column: controlPartitionColumn,
    lookback_days: lookbackDays,
    limit_clause: resolveLimitClause(limit),
  })
}

// config: { table, ruleType, partitionColumn, granularity, lookbackDays, limit, ...ruleSpecificFields }
export function buildRuleQuery(config) {
  const { ruleType } = config
  switch (ruleType) {
    case "not_null":
      return buildNotNullQuery(config)
    case "count_row":
      return buildCountRowQuery(config)
    case "missing_key":
      return buildMissingKeyQuery(config)
    case "missing_period":
      return buildMissingPeriodQuery(config)
    case "timeliness":
      return buildTimelinessQuery(config)
    case "validity_column":
      return buildValidityColumnQuery(config)
    case "consistency_key":
      return buildConsistencyKeyQuery(config)
    case "consistency_value":
      return buildConsistencyValueQuery(config)
    case "uniqueness_key":
      return buildUniquenessKeyQuery(config)
    case "range_check":
      return buildRangeCheckQuery(config)
    case "pattern_check":
      return buildPatternCheckQuery(config)
    case "allowed_values":
      return buildAllowedValuesQuery(config)
    default:
      throw new Error(`Unsupported rule_type: ${ruleType}`)
  }
}
