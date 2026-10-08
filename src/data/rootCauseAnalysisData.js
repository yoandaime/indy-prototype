// Mock data source for the Root Cause Analysis "Identification" dashboard.
// Every filter combination (category / dimension / rule / month) deterministically
// generates a different dataset, so changing a filter visibly changes the page
// while the same selection always returns the same numbers.

import { RULES_MANAGEMENT_CATEGORIES } from "@/data/rulesManagementData";

export const RCA_CATEGORIES = RULES_MANAGEMENT_CATEGORIES;

export const RCA_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Default pill row shown before "More" — the 5 most recent months leading up
// to "today" in this prototype's mock calendar (2026-10).
export const RCA_VISIBLE_MONTHS = [
  "June",
  "July",
  "August",
  "September",
  "October",
];
export const RCA_DEFAULT_MONTH = "October";

export const ALL_OPTION = "all";

// --- deterministic pseudo-random helpers ------------------------------------

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seedStr) {
  let a = hashString(seedStr) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (rng, list) => list[int(rng, 0, list.length - 1)];

function pickMany(rng, list, count) {
  const pool = [...list];
  const out = [];
  while (out.length < count && pool.length)
    out.push(pool.splice(int(rng, 0, pool.length - 1), 1)[0]);
  return out;
}

// --- vocab ------------------------------------------------------------------

const LAYERS = ["NDM SPEED LAYER", "NDM ANALYTIC LAYER"];
const VENDORS = ["HUAWEI", "ERICSSON", "ZTE", "NOKIA"];
const REGIONS = [
  "NATIONWIDE",
  "JAVA",
  "SUMATRA",
  "KALIMANTAN",
  "SULAWESI",
  "PAPUA",
  "BALI NUSRA",
];
const IP_SOURCES = [
  "NDM SPEED LAYER",
  "NDM ANALYTIC LAYER",
  "RAN COLLECTOR",
  "CORE GATEWAY",
  "BSS MEDIATION",
  "TRANSPORT PROBE",
];
const CASES_BY_DIMENSION = {
  Completeness: ["Missing Data Rows", "Null Value Spike", "Empty Partition"],
  Validity: ["Invalid Format", "Out of Range Value", "Unknown Code"],
  Uniqueness: ["Duplicate Records", "Duplicate Key"],
  Timeliness: ["Late Arrival", "Stale Partition", "Delayed Ingestion"],
  Consistency: ["Cross-table Mismatch", "Schema Drift"],
  Accuracy: ["Value Deviation", "Aggregation Mismatch"],
};
const DEFAULT_CASES = [
  "Missing Data Rows",
  "Invalid Format",
  "Duplicate Records",
  "Late Arrival",
];

const TABLES_BY_CATEGORY = {
  RAN: [
    "cell_hour_5g",
    "cell_hour_4g",
    "cell_hour_2g",
    "etl_5g_ran_ericsson_hourly",
    "etl_4g_ran_huawei_hourly",
    "etl_4g_ran_zte_hourly",
    "etl_5g_ran_zte_hourly",
    "etl_2g_ran_huawei_uso_kpi_hourly",
    "etl_4g_ran_huawei_uso_kpi_hourly",
  ],
  "CORE CS": [
    "etl_msc_cdr_hourly",
    "etl_mgw_traffic_hourly",
    "etl_hlr_subscriber_daily",
    "etl_vlr_attach_hourly",
    "etl_sms_cdr_hourly",
    "etl_call_setup_kpi_hourly",
  ],
  "CORE PS": [
    "etl_sgw_session_hourly",
    "etl_pgw_throughput_hourly",
    "etl_mme_attach_hourly",
    "etl_gtp_tunnel_hourly",
    "etl_pcrf_policy_daily",
    "etl_data_volume_kpi_hourly",
  ],
  TRANSPORT: [
    "etl_router_port_util_hourly",
    "etl_mw_link_quality_hourly",
    "etl_olt_traffic_daily",
    "etl_fiber_loss_hourly",
    "etl_sdh_alarm_hourly",
  ],
  IT: [
    "etl_billing_invoice_daily",
    "etl_crm_customer_daily",
    "etl_order_mgmt_hourly",
    "etl_oss_inventory_daily",
    "etl_hr_ticket_daily",
    "etl_mediation_cdr_hourly",
  ],
};
const SCHEMA_BY_LAYER = {
  "NDM SPEED LAYER": "default",
  "NDM ANALYTIC LAYER": "service_db",
};

function shortLabel(text, max = 16) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function trendLabels(month) {
  const end = RCA_MONTHS.indexOf(month);
  return Array.from({ length: 7 }, (_, i) => {
    const idx = end - (6 - i);
    const year = idx < 0 ? 2025 : 2026;
    const m = ((idx % 12) + 12) % 12;
    return `${year}-${String(m + 1).padStart(2, "0")}`;
  });
}

function trendSeries(rng, labels, base, spikeChance = 0.25) {
  return labels.map((month) => {
    const spike = rng() < spikeChance ? int(rng, 2, 5) : 1;
    return {
      month,
      value: Math.max(0, Math.round(base * (0.3 + rng() * 1.1) * spike)),
    };
  });
}

// --- generator --------------------------------------------------------------

export function getRcaDashboardData({ category, dimension, rule, month }) {
  const seed = [category, dimension, rule, month].join("|");
  const rng = createRng(seed);
  const labels = trendLabels(month);

  // Narrower filters => fewer issues, like a real drill-down.
  const narrowing =
    (dimension !== ALL_OPTION ? 0.6 : 1) * (rule !== ALL_OPTION ? 0.5 : 1);
  const base = int(rng, 14, 70) * narrowing;
  const monthIdx = RCA_MONTHS.indexOf(month);
  const isFuture = monthIdx > RCA_MONTHS.indexOf(RCA_DEFAULT_MONTH);

  const observability = labels.map((m) => ({
    month: m,
    warning: Math.round(base * rng() * 0.25),
    issue: Math.round(base * (0.2 + rng() * 1.2) * (rng() < 0.2 ? 2.5 : 1)),
  }));

  // Severity + layer share one total so both donuts always agree.
  const total = isFuture ? 0 : Math.max(1, Math.round(base * (0.3 + rng())));
  const crit = Math.round(total * rng() * 0.25);
  const major = Math.round((total - crit) * rng() * 0.6);
  const minor = total - crit - major;
  const severitySegments = [
    { label: "Critical", value: crit, color: "var(--color-red-500)" },
    { label: "Major", value: major, color: "var(--color-orange-500)" },
    { label: "Minor", value: minor, color: "var(--color-amber-400)" },
  ].filter((x) => x.value > 0);
  const speed = Math.round(total * (0.3 + rng() * 0.7));
  const layerSegments = [
    {
      label: "NDM SPEED LAYER",
      value: speed,
      color: "var(--color-violet-500)",
    },
    {
      label: "NDM ANALYTIC LAYER",
      value: total - speed,
      color: "var(--color-sky-400)",
    },
  ].filter((x) => x.value > 0);

  // Tables
  const tablePool = TABLES_BY_CATEGORY[category] ?? TABLES_BY_CATEGORY.RAN;
  const cases = CASES_BY_DIMENSION[dimension] ?? DEFAULT_CASES;
  const makeTables = (count) =>
    pickMany(rng, tablePool, count).map((name) => {
      const layer = pick(rng, LAYERS);
      return {
        name,
        layer,
        full: `${SCHEMA_BY_LAYER[layer]}.${name}`,
        days: int(rng, 1, 14),
      };
    });

  const worstTables = isFuture
    ? []
    : makeTables(int(rng, 4, 8)).sort((a, b) => b.days - a.days);
  const topWorstTables = worstTables.map((t) => ({
    label: shortLabel(t.full),
    sub: shortLabel(t.layer, 18),
    days: t.days,
  }));

  const topWorstVendors = isFuture
    ? []
    : Array.from({ length: int(rng, 4, 8) }, () => ({
        label: pick(rng, REGIONS),
        sub: pick(rng, VENDORS),
        days: int(rng, 1, 12),
      })).sort((a, b) => b.days - a.days);

  const topWorstIpSources = isFuture
    ? []
    : pickMany(rng, IP_SOURCES, int(rng, 2, 5))
        .map((label) => ({
          label: shortLabel(label, 18),
          sub: "",
          days: int(rng, 1, 9),
        }))
        .sort((a, b) => b.days - a.days);

  const biggestIssueByLayer = LAYERS.map((layer) => ({
    layer,
    rows: isFuture
      ? []
      : pickMany(rng, tablePool, int(rng, 2, 6))
          .map((name) => ({
            table: `${SCHEMA_BY_LAYER[layer]}.${name}`,
            case: pick(rng, cases),
            days: int(rng, 1, 15),
          }))
          .sort((a, b) => b.days - a.days)
          .map((r) => ({
            table: r.table,
            case: r.case,
            total: `${r.days} days`,
          })),
  })).reverse();

  const layerPerformance = LAYERS.slice()
    .reverse()
    .map((layer) => {
      const tableTotal = int(rng, 8, 120);
      const tablePass = Math.round(tableTotal * rng() * 0.8);
      const kpiTotal = int(rng, 200, 900);
      const kpiPass = Math.round(kpiTotal * rng() * 0.6);
      return {
        layer,
        score: Number((rng() * 90 + 5).toFixed(2)),
        tablePass,
        tablePassPct: Number(((tablePass / tableTotal) * 100).toFixed(2)),
        kpiPass,
        kpiPassPct: Number(((kpiPass / kpiTotal) * 100).toFixed(2)),
        mom: Number(((rng() - 0.55) * 8).toFixed(2)),
      };
    });

  const avg = (key) =>
    layerPerformance.reduce((sum, l) => sum + l[key], 0) /
    layerPerformance.length;
  // Score Card: headline quality metrics with day-on-day movement. The metric
  // list narrows to the selected dimension, so each filter reads differently.
  const scoreOf = () => Number((55 + rng() * 43).toFixed(1));
  const changeOf = () => Number(((rng() - 0.5) * 6).toFixed(1));
  const scoreCard = [
    {
      key: "completeness",
      label: "Completeness",
      value: scoreOf(),
      change: changeOf(),
    },
    {
      key: "dqi",
      label: "Data Quality Index",
      value: scoreOf(),
      change: changeOf(),
    },
  ].map((m) => ({
    ...m,
    status: m.value >= 90 ? "Good" : m.value >= 70 ? "Average" : "Poor",
  }));

  return {
    scoreCard,
    periodLabel: `${month.slice(0, 3)} 2026`,
    observability,
    trendTable: trendSeries(rng, labels, base * 2.2),
    trendVendorRegion: trendSeries(rng, labels, base * 1.6),
    trendIpSource: trendSeries(rng, labels, base * 0.7),
    issueBySeverity: { total, segments: severitySegments },
    issueByLayer: { total, segments: layerSegments },
    topWorstTables,
    topWorstVendors,
    topWorstIpSources,
    biggestIssueByLayer,
    layerPerformance,
  };
}

// Simulates a network round-trip so the UI can show its loading state.
export function fetchRcaDashboardData(filters) {
  const delay = 500 + (hashString(JSON.stringify(filters)) % 5) * 120;
  return new Promise((resolve) => {
    setTimeout(() => resolve(getRcaDashboardData(filters)), delay);
  });
}
