// Rules Management catalog — human-readable titles/descriptions and a
// ClickHouse-style SQL template per rule type, built on the SAME rule types
// and dimension grouping already defined in constants.js. This is a lighter,
// single-table representation (fixed placeholder tokens) meant for
// browsing/authoring rule formulas, distinct from DQ Composer's full
// multi-table generator in buildQuery.js which fills in real table/column
// names directly.

import { DIMENSIONS } from "./constants"

// Fixed contract for every rule formula in Rules Management (standard or
// custom) — same variables, same required output columns, regardless of
// rule type or dimension.
export const AVAILABLE_VARIABLES = [
  "{table}",
  "{column_name}",
  "{partition_column}",
  "{partition_expr}",
  "{date_start}",
  "{date_end}",
  "{final_clause}",
  "{denum}",
]
export const REQUIRED_OUTPUT_COLUMNS = ["table_name", "period", "rule_name", "num", "denom", "rate", "status"]

function ratioTemplate({ ruleName, denomSelect, numeratorExpr, numeratorAlias, denominatorAlias, passCondition }) {
  return `WITH s_daily AS (
  SELECT {partition_expr} AS period,
    ${denomSelect},
    ${numeratorExpr} AS ${numeratorAlias}
  FROM {table}{final_clause}
  WHERE {partition_column} >= toDate('{date_start}') AND {partition_column} < toDate('{date_end}') + INTERVAL 1 DAY
  GROUP BY period
)
SELECT
  '{table}' AS table_name,
  period AS period,
  '${ruleName}' AS rule_name,
  ${numeratorAlias} AS num,
  ${denominatorAlias} AS denom,
  ${denominatorAlias} - ${numeratorAlias} AS delta,
  round(100 * ${numeratorAlias} / ${denominatorAlias}, 2) AS rate,
  if(${passCondition}, 'PASS', 'FAIL') AS status
FROM s_daily`
}

const STANDARD_RULES = [
  {
    key: "not_null",
    dimension: "Completeness",
    title: "Not Null Check",
    description: "Cek kolom tidak null atau kosong",
    numerator: "countIf({column_name} IS NOT NULL AND {column_name} != '')",
    denominator: "{total_rows}",
    rate: "round(100 * countIf({column_name} IS NOT NULL AND {column_name} != '') / {total_rows}, 2)",
    createdBy: "Indy",
    template: ratioTemplate({
      ruleName: "not_null",
      denomSelect: "count() AS total_rows",
      numeratorExpr: "countIf({column_name} IS NOT NULL AND {column_name} != '')",
      numeratorAlias: "not_null_rows",
      denominatorAlias: "total_rows",
      passCondition: "not_null_rows = total_rows",
    }),
  },
  {
    key: "count_row",
    dimension: "Completeness",
    title: "Count Row",
    description: "Cek jumlah baris terhadap nilai referensi",
    numerator: "count()",
    denominator: "{denum}",
    rate: "round(100 * count() / {denum}, 2)",
    createdBy: "Indy",
    template: `WITH s_daily AS (
    SELECT {partition_expr} AS period, count() AS row_count
    FROM {table}{final_clause}
    WHERE {partition_column} >= toDate('{date_start}') AND {partition_column} < toDate('{date_end}') + INTERVAL 1 DAY
    GROUP BY period
)
SELECT
  '{table}' AS table_name,
  period AS period,
  'count_row' AS rule_name,
  row_count AS num,
  {denum} AS denom,
  {denum} - row_count AS delta,
  round(100 * row_count / {denum}, 2) AS rate,
  if(row_count BETWEEN {denum} * 0.98 AND {denum} * 1.05, 'PASS', 'FAIL') AS status
FROM s_daily`,
  },
  {
    key: "missing_key",
    dimension: "Completeness",
    title: "Missing Key",
    description: "Cek jumlah key unik terhadap nilai referensi",
    numerator: "countDistinct({column_name})",
    denominator: "{total_rows}",
    rate: "round(100 * countDistinct({column_name}) / {total_rows}, 2)",
    createdBy: "Indy",
    template: ratioTemplate({
      ruleName: "missing_key",
      denomSelect: "count() AS total_rows",
      numeratorExpr: "countDistinct({column_name})",
      numeratorAlias: "key_count",
      denominatorAlias: "total_rows",
      passCondition: "key_count = total_rows",
    }),
  },
  {
    key: "missing_period",
    dimension: "Completeness",
    title: "Missing Period",
    description: "Cek periode yang hilang dari jadwal yang diharapkan",
    numerator: "count(DISTINCT period)",
    denominator: "{expected_periods}",
    rate: "round(100 * count(DISTINCT period) / {expected_periods}, 2)",
    createdBy: "Indy",
    template: `WITH s_daily AS (
  SELECT {partition_expr} AS period
  FROM {table}{final_clause}
  WHERE {partition_column} >= toDate('{date_start}') AND {partition_column} < toDate('{date_end}') + INTERVAL 1 DAY
  GROUP BY period
)
SELECT
  '{table}' AS table_name,
  toDate('{date_end}') AS period,
  'missing_period' AS rule_name,
  count(DISTINCT period) AS num,
  {expected_periods} AS denom,
  {expected_periods} - count(DISTINCT period) AS delta,
  round(100 * count(DISTINCT period) / {expected_periods}, 2) AS rate,
  if(count(DISTINCT period) = {expected_periods}, 'PASS', 'FAIL') AS status
FROM s_daily`,
  },
  {
    key: "timeliness",
    dimension: "Timeliness",
    title: "Data Freshness",
    description: "Cek apakah data terbaru berada dalam lookback window",
    numerator: "dateDiff('hour', max({insert_time_column}), now())",
    denominator: "{max_delay_hours}",
    rate: "round(100 * (1 - dateDiff('hour', max({insert_time_column}), now()) / {max_delay_hours}), 2)",
    createdBy: "Indy",
    template: `SELECT
  '{table}' AS table_name,
  toDate(now()) AS period,
  'timeliness' AS rule_name,
  dateDiff('hour', max({insert_time_column}), now()) AS num,
  {max_delay_hours} AS denom,
  {max_delay_hours} - dateDiff('hour', max({insert_time_column}), now()) AS delta,
  round(100 * (1 - dateDiff('hour', max({insert_time_column}), now()) / {max_delay_hours}), 2) AS rate,
  if(dateDiff('hour', max({insert_time_column}), now()) <= {max_delay_hours}, 'PASS', 'FAIL') AS status
FROM {table}{final_clause}`,
  },
  {
    key: "validity_column",
    dimension: "Validity",
    title: "Validity Check",
    description: "Cek nilai kolom valid dan tidak kosong",
    numerator: "countIf(trim({column_name}) != '')",
    denominator: "{total_rows}",
    rate: "round(100 * countIf(trim({column_name}) != '') / {total_rows}, 2)",
    createdBy: "Indy",
    template: ratioTemplate({
      ruleName: "validity_column",
      denomSelect: "count() AS total_rows",
      numeratorExpr: "countIf(trim({column_name}) != '')",
      numeratorAlias: "valid_rows",
      denominatorAlias: "total_rows",
      passCondition: "valid_rows = total_rows",
    }),
  },
  {
    key: "consistency_key",
    dimension: "Consistency",
    title: "Key Consistency",
    description: "Cek key yang hilang dibanding periode sebelumnya",
    numerator: "countIf(prev.key_value IS NOT NULL)",
    denominator: "count()",
    rate: "round(100 * countIf(prev.key_value IS NOT NULL) / count(), 2)",
    createdBy: "Indy",
    template: `WITH curr AS (
  SELECT {partition_expr} AS period, {column_name} AS key_value
  FROM {table}{final_clause}
  WHERE {partition_column} >= toDate('{date_start}') AND {partition_column} < toDate('{date_end}') + INTERVAL 1 DAY
  GROUP BY period, key_value
),
prev AS (
  SELECT {partition_expr} + INTERVAL 1 DAY AS period, {column_name} AS key_value
  FROM {table}{final_clause}
  GROUP BY period, key_value
)
SELECT
  '{table}' AS table_name,
  curr.period AS period,
  'consistency_key' AS rule_name,
  countIf(prev.key_value IS NOT NULL) AS num,
  count() AS denom,
  count() - countIf(prev.key_value IS NOT NULL) AS delta,
  round(100 * countIf(prev.key_value IS NOT NULL) / count(), 2) AS rate,
  if(countIf(prev.key_value IS NULL) = 0, 'PASS', 'FAIL') AS status
FROM curr
LEFT JOIN prev ON curr.period = prev.period AND curr.key_value = prev.key_value
GROUP BY curr.period`,
  },
  {
    key: "consistency_value",
    dimension: "Consistency",
    title: "Value Consistency",
    description: "Cek pergeseran nilai agregat dibanding periode sebelumnya",
    numerator: "abs(curr.agg_value - prev.agg_value)",
    denominator: "prev.agg_value",
    rate: "round(100 * abs(curr.agg_value - prev.agg_value) / prev.agg_value, 2)",
    createdBy: "Indy",
    template: `WITH curr AS (
  SELECT {partition_expr} AS period, avg({column_name}) AS agg_value
  FROM {table}{final_clause}
  WHERE {partition_column} >= toDate('{date_start}') AND {partition_column} < toDate('{date_end}') + INTERVAL 1 DAY
  GROUP BY period
),
prev AS (
  SELECT {partition_expr} + INTERVAL 1 DAY AS period, avg({column_name}) AS agg_value
  FROM {table}{final_clause}
  GROUP BY period
)
SELECT
  '{table}' AS table_name,
  curr.period AS period,
  'consistency_value' AS rule_name,
  abs(curr.agg_value - prev.agg_value) AS num,
  prev.agg_value AS denom,
  round(100 * abs(curr.agg_value - prev.agg_value) / prev.agg_value, 2) AS rate,
  if(prev.agg_value IS NULL OR abs(curr.agg_value - prev.agg_value) / prev.agg_value <= 0.1, 'PASS', 'FAIL') AS status
FROM curr
LEFT JOIN prev ON curr.period = prev.period`,
  },
  {
    key: "uniqueness_key",
    dimension: "Uniqueness",
    title: "Uniqueness Check",
    description: "Cek duplikasi nilai pada kolom yang seharusnya unik",
    numerator: "countDistinct({column_name})",
    denominator: "count()",
    rate: "round(100 * countDistinct({column_name}) / count(), 2)",
    createdBy: "Indy",
    template: ratioTemplate({
      ruleName: "uniqueness_key",
      denomSelect: "count() AS total_rows",
      numeratorExpr: "countDistinct({column_name})",
      numeratorAlias: "uniq_rows",
      denominatorAlias: "total_rows",
      passCondition: "uniq_rows = total_rows",
    }),
  },
  {
    key: "range_check",
    dimension: "Accuracy",
    title: "Range Check",
    description: "Cek nilai kolom berada dalam rentang min/max",
    numerator: "countIf({column_name} BETWEEN {min_value} AND {max_value})",
    denominator: "{total_rows}",
    rate: "round(100 * countIf({column_name} BETWEEN {min_value} AND {max_value}) / {total_rows}, 2)",
    createdBy: "Indy",
    template: ratioTemplate({
      ruleName: "range_check",
      denomSelect: "count() AS total_rows",
      numeratorExpr: "countIf({column_name} BETWEEN {min_value} AND {max_value})",
      numeratorAlias: "in_range_rows",
      denominatorAlias: "total_rows",
      passCondition: "in_range_rows = total_rows",
    }),
  },
  {
    key: "pattern_check",
    dimension: "Accuracy",
    title: "Pattern Check",
    description: "Cek nilai kolom sesuai pattern regex",
    numerator: "countIf(match({column_name}, '{pattern}'))",
    denominator: "{total_rows}",
    rate: "round(100 * countIf(match({column_name}, '{pattern}')) / {total_rows}, 2)",
    createdBy: "Indy",
    template: ratioTemplate({
      ruleName: "pattern_check",
      denomSelect: "count() AS total_rows",
      numeratorExpr: "countIf(match({column_name}, '{pattern}'))",
      numeratorAlias: "matched_rows",
      denominatorAlias: "total_rows",
      passCondition: "matched_rows = total_rows",
    }),
  },
]

export function getStandardRules() {
  return STANDARD_RULES
}

export function getDimensionKeys() {
  return DIMENSIONS.map((d) => d.key)
}

export function validateRuleFormula(sql) {
  const lower = sql.toLowerCase()
  const missingColumns = REQUIRED_OUTPUT_COLUMNS.filter((col) => !lower.includes(col.toLowerCase()))
  const hasVariable = /\{[a-z_]+\}/i.test(sql)
  const valid = missingColumns.length === 0 && hasVariable
  return { valid, missingColumns, hasVariable }
}
