// Mock data source for the DQ Experience page's DQ Composer tool.
// Shape (schema/table/column names, sample values) is taken from real
// reference tables in src/data/dqcomposer_reference/source_data/ — trimmed to
// the identifying columns + a handful of numeric KPI columns for a workable
// mock UI, instead of the full 250+ column production tables.

const PERIOD_PATTERN = /datetime|date|timestamp/i

// Realistic column types for the mock tables — identifiers/dimensions stay
// strings, counters are ints, and KPI rates/throughput are floats.
const INT_COLUMNS = new Set(["cell_id", "counter_count"])
const FLOAT_PATTERN = /^nr_/

function resolveColumnType(column) {
  if (column === "date") return "date"
  if (PERIOD_PATTERN.test(column) || column.startsWith("insert_time")) return "datetime"
  if (INT_COLUMNS.has(column)) return "int"
  if (FLOAT_PATTERN.test(column)) return "float"
  return "string"
}

function buildColumns(names, primaryKeys = []) {
  return names.map((column) => ({
    column,
    type: resolveColumnType(column),
    is_period: PERIOD_PATTERN.test(column),
    is_primary_key: primaryKeys.includes(column),
  }))
}

const DAILY_COLUMN_NAMES = [
  "start_timestamp",
  "date",
  "cell_id",
  "cell_name",
  "erbs_id",
  "ip_source",
  "regional",
  "site_id",
  "region_new",
  "sales_region",
  "vendor",
  "site_class",
  "cluster_name",
  "branch_name",
  "province",
  "nr_sn_setup_success_rate",
  "nr_erab_setup_success_rate",
  "nr_retainability_rate",
  "nr_user_throughput_dl_mbps_relactuserdl",
  "counter_count",
]

const HOURLY_COLUMN_NAMES = [
  "start_timestamp",
  "cell_id",
  "cell_name",
  "erbs_id",
  "ip_source",
  "regional",
  "site_id",
  "region_new",
  "sales_region",
  "vendor",
  "site_class",
  "cluster_name",
  "branch_name",
  "nr_sn_setup_success_rate",
  "nr_erab_setup_success_rate",
  "nr_retainability_rate",
  "nr_user_throughput_dl_mbps_relactuserdl",
  "insert_time_clickhouse",
]

// Real sample rows (trimmed to the columns above), taken from the reference
// CSVs. nr_erab_setup_success_rate is genuinely blank in every source row —
// kept as-is so a not_null check against it fails realistically.
const DAILY_ROWS = [
  { start_timestamp: "2026-08-17 00:00:00", date: "2026-08-17", cell_id: 33, cell_name: "BGE716MK1_NEWBALIGEMK503", erbs_id: "815716", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE716", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 1.0088128038897892, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0061819252281424784, nr_user_throughput_dl_mbps_relactuserdl: 18.694634674484462, counter_count: 24 },
  { start_timestamp: "2026-08-17 00:00:00", date: "2026-08-17", cell_id: 13, cell_name: "BGE168MK1_BALIGESISINGAMANGARAJAMK501", erbs_id: "815168", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE168", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 1.018770226537217, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.011469504368349136, nr_user_throughput_dl_mbps_relactuserdl: 10.91091741418078, counter_count: 24 },
  { start_timestamp: "2026-08-17 00:00:00", date: "2026-08-17", cell_id: 33, cell_name: "BGE433MK1_SIBOLAHOTANGSASMK03", erbs_id: "815433", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE433", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 1.0009239297813366, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.001665741254858412, nr_user_throughput_dl_mbps_relactuserdl: 10.456155300417262, counter_count: 24 },
  { start_timestamp: "2026-08-17 00:00:00", date: "2026-08-17", cell_id: 13, cell_name: "BGE440MK1_PARSAORANAJIBATA2MK501", erbs_id: "815440", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE440", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Bronze", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 1.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0, nr_user_throughput_dl_mbps_relactuserdl: 0.0, counter_count: 24 },
  { start_timestamp: "2026-08-17 00:00:00", date: "2026-08-17", cell_id: 33, cell_name: "BGE168MK1_BALIGESISINGAMANGARAJAMK503", erbs_id: "815168", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE168", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 1.0259275175476292, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.011738367519816058, nr_user_throughput_dl_mbps_relactuserdl: 19.889610572817105, counter_count: 24 },
  { start_timestamp: "2026-08-17 00:00:00", date: "2026-08-17", cell_id: 13, cell_name: "BGE298MK1_HINALANGBAGASANMK501", erbs_id: "815298", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE298", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 0.9894358605821056, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.010796883626771364, nr_user_throughput_dl_mbps_relactuserdl: 2.9571342871959656, counter_count: 24 },
  { start_timestamp: "2026-08-17 00:00:00", date: "2026-08-17", cell_id: 23, cell_name: "BGE440MK1_PARSAORANAJIBATA2MK502", erbs_id: "815440", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE440", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Bronze", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 0.9375, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0, nr_user_throughput_dl_mbps_relactuserdl: 0.0, counter_count: 24 },
  { start_timestamp: "2026-08-17 00:00:00", date: "2026-08-17", cell_id: 13, cell_name: "BGE720MK1_SARIBURAJAJANJIMARIAMK01", erbs_id: "815720", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE720", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Silver", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 1.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0010164077246987077, nr_user_throughput_dl_mbps_relactuserdl: 19.37173283696317, counter_count: 24 },
  { start_timestamp: "2026-08-15 00:00:00", date: "2026-08-15", cell_id: 13, cell_name: "BGE168MK1_BALIGESISINGAMANGARAJAMK501", erbs_id: "815168", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE168", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 0.9909617612977983, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.009123047097730642, nr_user_throughput_dl_mbps_relactuserdl: 6.3484647479698015, counter_count: 24 },
  { start_timestamp: "2026-08-15 00:00:00", date: "2026-08-15", cell_id: 33, cell_name: "BGE433MK1_SIBOLAHOTANGSASMK03", erbs_id: "815433", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE433", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 0.9994960524105493, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0023334587881068875, nr_user_throughput_dl_mbps_relactuserdl: 6.136097084988379, counter_count: 24 },
  { start_timestamp: "2026-08-15 00:00:00", date: "2026-08-15", cell_id: 13, cell_name: "BGE440MK1_PARSAORANAJIBATA2MK501", erbs_id: "815440", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE440", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Bronze", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 1.048342541436464, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0, nr_user_throughput_dl_mbps_relactuserdl: 0.0, counter_count: 24 },
  { start_timestamp: "2026-08-16 00:00:00", date: "2026-08-16", cell_id: 13, cell_name: "BGE168MK1_BALIGESISINGAMANGARAJAMK501", erbs_id: "815168", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE168", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 0.9938956071552757, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.00744228432563791, nr_user_throughput_dl_mbps_relactuserdl: 11.679827471962136, counter_count: 24 },
  { start_timestamp: "2026-08-16 00:00:00", date: "2026-08-16", cell_id: 33, cell_name: "BGE433MK1_SIBOLAHOTANGSASMK03", erbs_id: "815433", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE433", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 0.9999304686413573, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0016505840528186896, nr_user_throughput_dl_mbps_relactuserdl: 7.191339408391736, counter_count: 24 },
  { start_timestamp: "2026-08-16 00:00:00", date: "2026-08-16", cell_id: 13, cell_name: "BGE440MK1_PARSAORANAJIBATA2MK501", erbs_id: "815440", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE440", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Bronze", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 0.9896774193548387, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.002544529262086514, nr_user_throughput_dl_mbps_relactuserdl: 0.0, counter_count: 24 },
  { start_timestamp: "2026-08-11 00:00:00", date: "2026-08-11", cell_id: 33, cell_name: "BGE716MK1_NEWBALIGEMK503", erbs_id: "815716", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE716", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 1.0537796410323594, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0037232764833053087, nr_user_throughput_dl_mbps_relactuserdl: 21.056621220869523, counter_count: 24 },
  { start_timestamp: "2026-08-12 00:00:00", date: "2026-08-12", cell_id: 33, cell_name: "BGE716MK1_NEWBALIGEMK503", erbs_id: "815716", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE716", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 1.1545163584637268, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0018729397662571171, nr_user_throughput_dl_mbps_relactuserdl: 24.982557299457962, counter_count: 24 },
  { start_timestamp: "2026-08-13 00:00:00", date: "2026-08-13", cell_id: 33, cell_name: "BGE716MK1_NEWBALIGEMK503", erbs_id: "815716", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE716", region_new: "", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", province: "SUMATERA UTARA", nr_sn_setup_success_rate: 1.0270044543429844, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.005352187128320338, nr_user_throughput_dl_mbps_relactuserdl: 14.5713520802224, counter_count: 24 },
]

const HOURLY_ROWS = [
  { start_timestamp: "2026-08-18 13:00:00", cell_id: 143, cell_name: "EPA013EK1_KALDERAEK514", erbs_id: "807013", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "EPA013", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Bronze", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0, nr_user_throughput_dl_mbps_relactuserdl: 0.0, insert_time_clickhouse: "2026-08-18 16:06:02.000 +0700" },
  { start_timestamp: "2026-08-18 13:00:00", cell_id: 23, cell_name: "BGE194MK1_LUMBANDOLOKMK02", erbs_id: "815194", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE194", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.22396416573348266, nr_user_throughput_dl_mbps_relactuserdl: 22.344277447299262, insert_time_clickhouse: "2026-08-18 16:06:01.000 +0700" },
  { start_timestamp: "2026-08-18 13:00:00", cell_id: 23, cell_name: "BGE720MK1_SARIBURAJAJANJIMARIAMK02", erbs_id: "815720", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE720", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Silver", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0, nr_user_throughput_dl_mbps_relactuserdl: 38.68960829550821, insert_time_clickhouse: "2026-08-18 16:06:02.000 +0700" },
  { start_timestamp: "2026-08-18 14:00:00", cell_id: 143, cell_name: "EPA013EK1_KALDERAEK514", erbs_id: "807013", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "EPA013", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Bronze", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 240.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.0, nr_user_throughput_dl_mbps_relactuserdl: 0.0, insert_time_clickhouse: "2026-08-18 16:06:02.000 +0700" },
  { start_timestamp: "2026-08-18 14:00:00", cell_id: 23, cell_name: "BGE194MK1_LUMBANDOLOKMK02", erbs_id: "815194", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE194", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 165.41666666666666, nr_erab_setup_success_rate: null, nr_retainability_rate: 1.1764705882352942, nr_user_throughput_dl_mbps_relactuserdl: 19.033794627199107, insert_time_clickhouse: "2026-08-18 16:06:02.000 +0700" },
  { start_timestamp: "2026-08-18 14:00:00", cell_id: 23, cell_name: "BGE720MK1_SARIBURAJAJANJIMARIAMK02", erbs_id: "815720", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE720", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Silver", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.25445292620864, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.23866348448687352, nr_user_throughput_dl_mbps_relactuserdl: 36.63568564769982, insert_time_clickhouse: "2026-08-18 16:06:02.000 +0700" },
  { start_timestamp: "2026-08-17 10:00:00", cell_id: 33, cell_name: "BGE194MK1_LUMBANDOLOKMK03", erbs_id: "815194", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE194", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 1.794453507340946, nr_user_throughput_dl_mbps_relactuserdl: 16.10348318863801, insert_time_clickhouse: "2026-08-17 13:05:47.000 +0700" },
  { start_timestamp: "2026-08-17 10:00:00", cell_id: 33, cell_name: "BGE298MK1_HINALANGBAGASANMK503", erbs_id: "815298", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE298", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.6329113924050633, nr_user_throughput_dl_mbps_relactuserdl: 22.743761666522463, insert_time_clickhouse: "2026-08-17 13:05:47.000 +0700" },
  { start_timestamp: "2026-08-17 10:00:00", cell_id: 13, cell_name: "BGE433MK1_SIBOLAHOTANGSASMK01", erbs_id: "815433", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE433", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.2402691013935608, nr_user_throughput_dl_mbps_relactuserdl: 17.525678740074394, insert_time_clickhouse: "2026-08-17 13:05:47.000 +0700" },
  { start_timestamp: "2026-08-17 11:00:00", cell_id: 33, cell_name: "BGE194MK1_LUMBANDOLOKMK03", erbs_id: "815194", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE194", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.7836990595611284, nr_user_throughput_dl_mbps_relactuserdl: 17.500888076190478, insert_time_clickhouse: "2026-08-17 14:04:52.000 +0700" },
  { start_timestamp: "2026-08-17 11:00:00", cell_id: 33, cell_name: "BGE298MK1_HINALANGBAGASANMK503", erbs_id: "815298", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE298", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.646551724137931, nr_user_throughput_dl_mbps_relactuserdl: 15.944018008649303, insert_time_clickhouse: "2026-08-17 14:04:52.000 +0700" },
  { start_timestamp: "2026-08-17 11:00:00", cell_id: 13, cell_name: "BGE433MK1_SIBOLAHOTANGSASMK01", erbs_id: "815433", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE433", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.12376237623762376, nr_user_throughput_dl_mbps_relactuserdl: 22.381870798818067, insert_time_clickhouse: "2026-08-17 14:04:52.000 +0700" },
  { start_timestamp: "2026-08-17 12:00:00", cell_id: 33, cell_name: "BGE194MK1_LUMBANDOLOKMK03", erbs_id: "815194", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE194", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.5082592121982211, nr_user_throughput_dl_mbps_relactuserdl: 13.714839265092646, insert_time_clickhouse: "2026-08-17 15:05:07.000 +0700" },
  { start_timestamp: "2026-08-17 12:00:00", cell_id: 33, cell_name: "BGE298MK1_HINALANGBAGASANMK503", erbs_id: "815298", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE298", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.2695417789757413, nr_user_throughput_dl_mbps_relactuserdl: 14.608870939070387, insert_time_clickhouse: "2026-08-17 15:05:07.000 +0700" },
  { start_timestamp: "2026-08-17 12:00:00", cell_id: 13, cell_name: "BGE433MK1_SIBOLAHOTANGSASMK01", erbs_id: "815433", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE433", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.029726516052318665, nr_user_throughput_dl_mbps_relactuserdl: 21.509837240386272, insert_time_clickhouse: "2026-08-17 15:05:07.000 +0700" },
  { start_timestamp: "2026-08-17 13:00:00", cell_id: 33, cell_name: "BGE194MK1_LUMBANDOLOKMK03", erbs_id: "815194", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE194", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 1.1185682326621924, nr_user_throughput_dl_mbps_relactuserdl: 12.09985208383522, insert_time_clickhouse: "2026-08-17 16:04:28.000 +0700" },
  { start_timestamp: "2026-08-17 13:00:00", cell_id: 33, cell_name: "BGE298MK1_HINALANGBAGASANMK503", erbs_id: "815298", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE298", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.547945205479452, nr_user_throughput_dl_mbps_relactuserdl: 13.76748150899249, insert_time_clickhouse: "2026-08-17 16:04:28.000 +0700" },
  { start_timestamp: "2026-08-17 13:00:00", cell_id: 13, cell_name: "BGE433MK1_SIBOLAHOTANGSASMK01", erbs_id: "815433", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE433", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 0.10087424344317418, nr_user_throughput_dl_mbps_relactuserdl: 15.46681045562278, insert_time_clickhouse: "2026-08-17 16:04:28.000 +0700" },
  { start_timestamp: "2026-08-17 14:00:00", cell_id: 33, cell_name: "BGE194MK1_LUMBANDOLOKMK03", erbs_id: "815194", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE194", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Gold", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 1.3966480446927374, nr_user_throughput_dl_mbps_relactuserdl: 9.20506347625807, insert_time_clickhouse: "2026-08-17 17:05:01.000 +0700" },
  { start_timestamp: "2026-08-17 14:00:00", cell_id: 33, cell_name: "BGE298MK1_HINALANGBAGASANMK503", erbs_id: "815298", ip_source: "192.0.2.15", regional: "SUMBAGUT", site_id: "BGE298", region_new: "SUMBAGUT", sales_region: "SUMBAGUT", vendor: "ERICSSON", site_class: "Platinum", cluster_name: "SAMOSIR", branch_name: "PEMATANG SIANTAR", nr_sn_setup_success_rate: 100.0, nr_erab_setup_success_rate: null, nr_retainability_rate: 1.7751479289940828, nr_user_throughput_dl_mbps_relactuserdl: 14.014988706785365, insert_time_clickhouse: "2026-08-17 17:05:01.000 +0700" },
]

export const DQ_CONNECTIONS = ["192.0.2.14:9000", "192.0.2.16:9000", "192.0.2.17:5432"]

export const DQ_CONNECTION_SCHEMAS = {
  "192.0.2.14:9000": ["default"],
  "192.0.2.16:9000": ["default"],
  "192.0.2.17:5432": ["public"],
}

// Back-compat flat schema list — used by the Composer's Table B picker, which
// only ever joins within the connection already selected on the left.
export const DQ_SCHEMAS = DQ_CONNECTION_SCHEMAS[DQ_CONNECTIONS[0]]

export const DQ_TABLES = {
  "192.0.2.14:9000": {
    default: [
      {
        table: "etl_cell_5g_ran_ericsson_kpi_daily",
        granularity: "daily",
        columns: buildColumns(DAILY_COLUMN_NAMES, ["date"]),
        rows: DAILY_ROWS,
      },
      {
        table: "etl_cell_5g_ran_ericsson_kpi_hourly",
        granularity: "hourly",
        columns: buildColumns(HOURLY_COLUMN_NAMES, ["start_timestamp"]),
        rows: HOURLY_ROWS,
      },
    ],
  },
  "192.0.2.16:9000": {
    default: [],
  },
  "192.0.2.17:5432": {
    public: [],
  },
}

export function getSchemasForConnection(connection) {
  return DQ_CONNECTION_SCHEMAS[connection] || []
}

export function getTablesForConnection(connection, schema) {
  return (DQ_TABLES[connection] && DQ_TABLES[connection][schema]) || []
}

export function findMockTable(connection, schema, table) {
  return getTablesForConnection(connection, schema).find((t) => t.table === table) || null
}

export function fullTableName(schema, table) {
  return `${schema}.${table}`
}
