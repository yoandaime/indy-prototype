// Mock data for the "Add New Data Source" wizard — ported from the
// ndq-enrich-platform reference (js/data.js), adapted for React.

export const REGISTERED_IPS = ["192.168.10.45"]

export const WIZARD_COLUMNS = [
  { name: "start_timestamp", type_id: 2, expr_id: 9, is_uniq: false, is_validity: true },
  { name: "cell_id", type_id: 7, expr_id: 10, is_uniq: false, is_validity: true },
  { name: "cell_name", type_id: 1, expr_id: 13, is_uniq: false, is_validity: true },
  { name: "erbs_id", type_id: 1, expr_id: 13, is_uniq: false, is_validity: true },
  { name: "regional", type_id: 8, expr_id: 50, is_uniq: false, is_validity: false },
  { name: "site_id", type_id: 8, expr_id: 50, is_uniq: false, is_validity: false },
  { name: "vendor", type_id: 7, expr_id: 10, is_uniq: false, is_validity: false },
  { name: "insert_time_clickhouse", type_id: 7, expr_id: 10, is_uniq: false, is_validity: false },
  { name: "gnodebid", type_id: 7, expr_id: 49, is_uniq: false, is_validity: true },
  { name: "nr_dl_payload_volume_gbyte", type_id: 4, expr_id: 1, is_uniq: false, is_validity: false },
  { name: "nr_ul_payload_volume_gbyte", type_id: 4, expr_id: 1, is_uniq: false, is_validity: false },
  { name: "nr_rrc_user_number", type_id: 4, expr_id: 2, is_uniq: false, is_validity: false },
  { name: "nr_packet_loss_rate", type_id: 4, expr_id: 1, is_uniq: false, is_validity: false },
  { name: "nr_availability_rate", type_id: 4, expr_id: 1, is_uniq: false, is_validity: false },
  { name: "nr_retainability_rate", type_id: 4, expr_id: 1, is_uniq: false, is_validity: false },
]

// Cron: 5 6,7,9,12,15,17,21 * * *
export const WIZARD_SCHEDULE = {
  start_time: "2026-07-02 10:05",
  end_time: null,
  cron: "5 6,7,9,12,15,17,21 * * *",
  enabled: true,
  human: "Every day at :05 past 06:00, 07:00, 09:00, 12:00, 15:00, 17:00, and 21:00 — all months, all days",
}

export const CONNECTION_TYPE_OPTIONS = ["Kafka", "JDBC", "REST API", "SFTP"]

export const CATEGORY_OPTIONS = [
  "Network Performance",
  "Data Quality",
  "Core Network",
  "Radio Access Network",
]

export const GROUP_APPS_OPTIONS = ["DSP Analytics", "Core Monitoring", "RAN Operations"]

export const LAYER_OPTIONS = ["Layer 1 — Raw", "Layer 2 — Cleansed", "Layer 3 — Enriched"]

export const CONFIG_CONNECTION_TYPE_OPTIONS = [
  "Type 4 — Kafka Stream",
  "Type 1 — JDBC",
  "Type 2 — REST",
]

export const GRANULARITY_OPTIONS = ["Hourly", "Daily", "Weekly"]

export const DIMENSION_OPTIONS = [
  "count_row",
  "validity_kpi",
  "timeliness",
  "completeness",
  "accuracy",
  "uniqueness",
]

export const DEFAULT_SELECTED_DIMENSIONS = ["count_row", "validity_kpi", "timeliness"]

export const ENDPOINT_IP_OPTIONS = [
  { value: "3", label: "192.168.10.45 (ID: 3)" },
  { value: "5", label: "192.0.2.1 (ID: 5)" },
  { value: "7", label: "172.16.0.1 (ID: 7)" },
]
