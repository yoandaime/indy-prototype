// Rule/dimension configuration mirrored from the reference backend's
// core/rules.py, so labels, defaults and limits stay in sync with the real
// SQL generation logic in buildQuery.js.

export const DEFAULT_PARTITION_COLUMN = "start_timestamp"
export const DEFAULT_LOOKBACK_DAYS = 7
export const DEFAULT_LIMIT = 100
export const DEFAULT_GRANULARITY = "daily"
export const MAX_NOT_NULL_COLUMNS = 5
export const MAX_MISSING_KEY_COLUMNS = 5

export const GRANULARITIES = [
  "five_minutely",
  "quarter_hourly",
  "hourly",
  "daily",
  "weekly",
  "monthly",
]

export const MISSING_PERIOD_GRANULARITIES = ["five_minutely", "quarter_hourly", "hourly"]

export const EXPECTED_PERIODS_PER_DAY = {
  five_minutely: 288,
  quarter_hourly: 96,
  hourly: 24,
}

export const CONSISTENCY_KEY_MODES = ["summary", "detail"]
export const CONSISTENCY_VALUE_AGGREGATIONS = ["sum", "max", "min", "avg", "count"]

// Dimension -> rule type(s), and a short human label per rule type.
export const DIMENSIONS = [
  {
    key: "Completeness",
    ruleTypes: ["not_null", "count_row", "missing_key", "missing_period"],
  },
  { key: "Timeliness", ruleTypes: ["timeliness"] },
  { key: "Validity", ruleTypes: ["validity_column", "allowed_values"] },
  { key: "Consistency", ruleTypes: ["consistency_key", "consistency_value"] },
  { key: "Uniqueness", ruleTypes: ["uniqueness_key"] },
  { key: "Accuracy", ruleTypes: ["range_check", "pattern_check"] },
]

export const RULE_TYPE_LABELS = {
  not_null: "not_null",
  count_row: "count_row",
  missing_key: "missing_key",
  missing_period: "missing_period",
  timeliness: "timeliness",
  validity_column: "validity_column",
  consistency_key: "consistency_key",
  consistency_value: "consistency_value",
  uniqueness_key: "uniqueness_key",
  range_check: "range_check",
  pattern_check: "pattern_check",
  allowed_values: "allowed_values",
}

export function ruleTypesForDimension(dimensionKey) {
  return DIMENSIONS.find((d) => d.key === dimensionKey)?.ruleTypes || []
}

// Count-row "Reference" sources. "custom" takes a free-text expected count;
// the others derive the expected count from the rows in the selected window.
export const COUNT_ROW_REFERENCE_MODES = [
  { value: "history", label: "History" },
  { value: "max_value", label: "Max Value" },
  { value: "min_value", label: "Min Value" },
  { value: "last_day", label: "Last Day" },
  { value: "custom", label: "Custom" },
]
