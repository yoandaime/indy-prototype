// Mock data matching the shape used by the old ndq-enrich-platform admin pages

export const ADMIN_CONNECTIONS = [
  { connection_id: 1, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_5g_ran_ericsson_kpi_daily', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_5g', granularity: 'daily', features: ['count_row', 'validity_kpi', 'timeliness', 'uniqueness'], ola_readiness: '1 day 08:00:00' },
  { connection_id: 2, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_5g_ran_ericsson_kpi_hourly', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_5g', granularity: 'hourly', features: ['count_row', 'validity_kpi', 'timeliness', 'uniqueness'], ola_readiness: '04:00:00' },
  { connection_id: 3, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_5g_ran_zte_kpi_hourly', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_5g', granularity: 'hourly', features: ['count_row', 'validity_kpi', 'timeliness', 'uniqueness'], ola_readiness: '04:00:00' },
  { connection_id: 4, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_5g_ran_zte_kpi_daily', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_5g', granularity: 'daily', features: ['count_row', 'validity_kpi', 'timeliness', 'uniqueness'], ola_readiness: '1 day 08:00:00' },
  { connection_id: 5, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_5g_ran_huawei_kpi_daily', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_5g', granularity: 'daily', features: ['count_row', 'validity_kpi', 'timeliness', 'uniqueness'], ola_readiness: '1 day 08:00:00' },
  { connection_id: 6, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_5g_ran_huawei_kpi_hourly', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_5g', granularity: 'hourly', features: ['count_row', 'validity_kpi', 'timeliness', 'uniqueness'], ola_readiness: '04:00:00' },
  { connection_id: 23, group_apps: 'NDM', category: 'CORE CS', layer_name: 'Speed Layer', table_name: 'smy.etl_core_cs_nokia_gcs_dd', control_table: 'reference.core_control_table', reference: 'smy.etl_core_cs_nokia_gcs_dd', granularity: 'daily', features: ['count_row', 'timeliness', 'validity_core', 'uniqueness'], ola_readiness: '1 day 08:00:00' },
  { connection_id: 24, group_apps: 'NDM', category: 'CORE VAS', layer_name: 'Speed Layer', table_name: 'base.oss_core_vas_sms_msc_hh', control_table: 'reference.core_control_table', reference: 'base.oss_core_vas_sms_msc_hh', granularity: 'hourly', features: ['count_row', 'timeliness', 'validity_core'], ola_readiness: '06:00:00' },
  { connection_id: 25, group_apps: 'NDM', category: 'CORE CS', layer_name: 'Speed Layer', table_name: 'smy.etl_core_cs_huawei_cscf_dd', control_table: 'reference.core_control_table', reference: 'smy.etl_core_cs_huawei_cscf_d', granularity: 'daily', features: ['count_row', 'timeliness', 'validity_core', 'uniqueness'], ola_readiness: '1 day 08:00:00' },
  { connection_id: 261, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_5g_ran_ericsson_kpi_daily', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_5g', granularity: 'daily', features: ['count_row', 'validity_kpi', 'timeliness', 'uniqueness'], ola_readiness: '1 day 08:00:00' },
  { connection_id: 26, group_apps: 'NDM', category: 'CORE VAS', layer_name: 'Speed Layer', table_name: 'base.oss_core_vas_ussd_msc_hh', control_table: 'reference.core_control_table', reference: 'base.oss_core_vas_ussd_msc_hh', granularity: 'hourly', features: ['count_row', 'timeliness', 'validity_core'], ola_readiness: '06:00:00' },
  { connection_id: 27, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_4g_ran_nokia_kpi_daily', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_4g', granularity: 'daily', features: ['count_row', 'validity_kpi', 'timeliness'], ola_readiness: '1 day 08:00:00' },
  { connection_id: 28, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_4g_ran_nokia_kpi_hourly', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_4g', granularity: 'hourly', features: ['count_row', 'validity_kpi', 'timeliness'], ola_readiness: '04:00:00' },
  { connection_id: 29, group_apps: 'NDM', category: 'CORE CS', layer_name: 'Speed Layer', table_name: 'smy.etl_core_cs_ericsson_msc_dd', control_table: 'reference.core_control_table', reference: 'smy.etl_core_cs_ericsson_msc_dd', granularity: 'daily', features: ['count_row', 'timeliness', 'validity_core', 'uniqueness'], ola_readiness: '1 day 08:00:00' },
  { connection_id: 30, group_apps: 'NDM', category: 'CORE VAS', layer_name: 'Speed Layer', table_name: 'base.oss_core_vas_voice_msc_hh', control_table: 'reference.core_control_table', reference: 'base.oss_core_vas_voice_msc_hh', granularity: 'hourly', features: ['count_row', 'timeliness', 'validity_core'], ola_readiness: '06:00:00' },
  { connection_id: 31, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_3g_ran_ericsson_kpi_daily', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_3g', granularity: 'daily', features: ['count_row', 'validity_kpi', 'uniqueness'], ola_readiness: '1 day 08:00:00' },
  { connection_id: 32, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_3g_ran_ericsson_kpi_hourly', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_3g', granularity: 'hourly', features: ['count_row', 'validity_kpi', 'uniqueness'], ola_readiness: '04:00:00' },
  { connection_id: 33, group_apps: 'NDM', category: 'CORE CS', layer_name: 'Speed Layer', table_name: 'smy.etl_core_cs_huawei_mgw_dd', control_table: 'reference.core_control_table', reference: 'smy.etl_core_cs_huawei_mgw_dd', granularity: 'daily', features: ['count_row', 'timeliness', 'validity_core'], ola_readiness: '1 day 08:00:00' },
  { connection_id: 34, group_apps: 'NDM', category: 'CORE VAS', layer_name: 'Speed Layer', table_name: 'base.oss_core_vas_data_gprs_hh', control_table: 'reference.core_control_table', reference: 'base.oss_core_vas_data_gprs_hh', granularity: 'hourly', features: ['count_row', 'timeliness', 'validity_core', 'uniqueness'], ola_readiness: '06:00:00' },
  { connection_id: 35, group_apps: 'NDM', category: 'RAN', layer_name: 'Speed Layer', table_name: 'default.etl_cell_5g_ran_zte_kpi_daily_v2', control_table: 'reference.ran_control_table', reference: 'default.icam_ran_data_full_5g', granularity: 'daily', features: ['count_row', 'validity_kpi', 'timeliness', 'uniqueness'], ola_readiness: '1 day 08:00:00' },
];

const ADMIN_DETAIL_OVERRIDES = {
  261: {
    columns: [
      { no: 1, connection_id: 261, column_name: 'yearmonth', type_id: null, expression_id: null, is_uniq: false, is_validity: false },
      { no: 2, connection_id: 261, column_name: 'date_end', type_id: null, expression_id: null, is_uniq: false, is_validity: false },
    ],
    active_table: { connection_id: 261, enabled: true },
    schedule: { start_time: '08/07/2026', conn_id: 261, cron_schedule: '55 6,7,9,12,15', enabled: false },
  },
};

const FEATURE_DIMENSION_MAP = {
  count_row: { dimension: 'completeness', description: 'count_row' },
  timeliness: { dimension: 'timeliness', description: 'timeliness' },
  validity_kpi: { dimension: 'validity', description: 'validity_kpi' },
  validity_core: { dimension: 'validity', description: 'validity_core' },
  uniqueness: { dimension: 'uniqueness', description: 'uniqueness' },
};

function buildDefaultDetail(conn) {
  const id = conn.connection_id;
  return {
    connection: conn,
    columns: [
      { no: 1, connection_id: id, column_name: 'yearmonth', type_id: null, expression_id: null, is_uniq: false, is_validity: false },
      { no: 2, connection_id: id, column_name: 'date_end', type_id: null, expression_id: null, is_uniq: false, is_validity: false },
    ],
    dimension_rules: conn.features
      .filter((f) => FEATURE_DIMENSION_MAP[f])
      .map((f) => ({ connection_id: id, ...FEATURE_DIMENSION_MAP[f] })),
    active_table: { connection_id: id, enabled: true },
    schedule: {
      start_time: '08/07/2026',
      conn_id: id,
      cron_schedule: conn.granularity === 'hourly' ? '0 * * * *' : '55 6,7,9,12,15',
      enabled: true,
    },
  };
}

export const ADMIN_DETAIL = {};
ADMIN_CONNECTIONS.forEach((conn) => {
  const override = ADMIN_DETAIL_OVERRIDES[conn.connection_id] || {};
  ADMIN_DETAIL[conn.connection_id] = { ...buildDefaultDetail(conn), ...override, connection: conn };
});
