// Mock data for the Ticketing (NDQ-Forum) page — no backend integration yet.

export const CURRENT_USER = "Antonio Nusa"

export const STATUS = {
  pending: "pending",
  open: "open",
  inProgress: "inProgress",
  solved: "solved",
  closed: "closed",
}

export const STATUS_META = {
  pending: {
    label: "Pending",
    archiveLabel: "Pending",
    badgeClass: "bg-gray-700 text-gray-50",
    dotClass: "bg-gray-50",
    outlineClass: "bg-gray-100 border-gray-700 text-gray-700",
    outlineDotClass: "bg-gray-700",
  },
  open: {
    label: "Open",
    archiveLabel: "Terkirim",
    // Solid style — used for the Kanban column header badge only.
    badgeClass: "bg-sky-700 text-sky-50",
    dotClass: "bg-sky-50",
    // Outline style — used everywhere else (grid cards, list rows).
    outlineClass: "bg-sky-100 border-sky-700 text-sky-700",
    outlineDotClass: "bg-sky-700",
  },
  inProgress: {
    label: "In Progress",
    archiveLabel: "Active Issue",
    badgeClass: "bg-amber-700 text-yellow-50",
    dotClass: "bg-yellow-50",
    outlineClass: "bg-amber-100 border-amber-700 text-amber-700",
    outlineDotClass: "bg-amber-700",
  },
  solved: {
    label: "Solved",
    archiveLabel: "Arsip Solusi",
    badgeClass: "bg-emerald-700 text-emerald-50",
    dotClass: "bg-emerald-50",
    outlineClass: "bg-green-100 border-green-700 text-green-700",
    outlineDotClass: "bg-green-700",
  },
  closed: {
    label: "Closed",
    archiveLabel: "Arsip Solusi",
    badgeClass: "bg-purple-700 text-purple-50",
    dotClass: "bg-purple-50",
    outlineClass: "bg-purple-100 border-purple-700 text-purple-700",
    outlineDotClass: "bg-purple-700",
  },
}

export const PRIORITY_META = {
  Critical: {
    label: "Critical",
    labelClass: "text-red-700",
    dotClass: "bg-red-600",
  },
  High: {
    label: "High",
    labelClass: "text-orange-700",
    dotClass: "bg-orange-600",
  },
  Medium: {
    label: "Medium",
    labelClass: "text-yellow-700",
    dotClass: "bg-yellow-500",
  },
  Low: {
    label: "Low",
    labelClass: "text-amber-700",
    dotClass: "bg-amber-600",
  },
  P0: {
    label: "P0",
    labelClass: "text-red-700",
    dotClass: "bg-red-600",
  },
  P1: {
    label: "P1",
    labelClass: "text-orange-700",
    dotClass: "bg-orange-600",
  },
  P2: {
    label: "P2",
    labelClass: "text-yellow-700",
    dotClass: "bg-yellow-500",
  },
}

// Longer, descriptive labels for the priority picker on the New/Add Issue
// dialog — the board and detail views use the short PRIORITY_META.label instead.
export const PRIORITY_DESCRIPTIONS = {
  P0: "P0 — Service affecting",
  P1: "P1 — Needs attention today",
  P2: "P2 — Can wait",
}

// New tickets are raised against this P0/P1/P2 scale, kept consistent with
// SLA Management (src/pages/ticketing-admin/SlaManagementSection.jsx). The
// legacy Critical/High/Medium/Low keys above stay only for existing mock tickets.
export const ISSUE_PRIORITY_OPTIONS = ["P0", "P1", "P2"]

// Issue Category options shared between the New Ticket, Duplicate and Update
// ticket dialogs.
export const TICKET_KIND_OPTIONS = ["Kendala", "Request"]
export const APPLICATION_OPTIONS = ["Network Data", "ICAM", "OSS", "BSS"]
export const SCOPE_OPTIONS = ["Data Quality", "Data Ingestion"]
export const CONCERN_OPTIONS = ["Completeness", "Uniqueness", "Validity"]

// Resolution targets (minutes) per priority — mirrors the defaults on the SLA
// Management admin page, used here to derive each ticket's live SLA badge.
export const SLA_TARGET_MINUTES = {
  P0: 60,
  P1: 120,
  P2: 240,
}

export const CREATED_BY_OPTIONS = [
  { value: "all", label: "System & Non system" },
  { value: "system", label: "System" },
  { value: "non-system", label: "Non system" },
]

export function formatSlaDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  if (hours < 24) return remMinutes ? `${hours}h ${remMinutes}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours ? `${days}d ${remHours}h` : `${days}d`
}

// Computes the live SLA badge state for a ticket: "left"/"overdue" while it's
// still active, "met"/"missed" once it's solved or closed (against resolvedAt).
// Time spent on hold (ticket.totalHoldMinutes, accrued via Put on hold) is
// excluded from the elapsed time, same as the Resolution summary card.
export function getSlaInfo(ticket, now = new Date()) {
  const targetMinutes = SLA_TARGET_MINUTES[ticket.priority]
  if (!targetMinutes) return { state: "unknown", label: "SLA —" }

  const holdMinutes = ticket.totalHoldMinutes ?? 0
  const isDone = ticket.status === STATUS.solved || ticket.status === STATUS.closed

  if (isDone) {
    const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : now
    const elapsedMinutes = (resolvedAt.getTime() - new Date(ticket.createdAt).getTime()) / 60000 - holdMinutes
    const diffMinutes = targetMinutes - elapsedMinutes
    if (diffMinutes >= 0) {
      return { state: "met", label: `SLA Met with ${formatSlaDuration(diffMinutes)} to spare` }
    }
    return { state: "missed", label: `SLA Missed by ${formatSlaDuration(-diffMinutes)}` }
  }

  const elapsedMinutes = (now.getTime() - new Date(ticket.createdAt).getTime()) / 60000 - holdMinutes
  const diffMinutes = targetMinutes - elapsedMinutes
  if (diffMinutes >= 0) {
    return { state: "left", label: `SLA ${formatSlaDuration(diffMinutes)} left` }
  }
  return { state: "overdue", label: `SLA Overdue by ${formatSlaDuration(-diffMinutes)}` }
}

// Response-time counterpart of getSlaInfo, used by the ticket detail page's
// Response summary card. Target is half of the resolution target (mirrors the
// Response/Resolution split shown in the ticketing reference UI). "Responded"
// is recorded the first time a ticket is moved to In Progress via Resume.
export function getResponseSlaInfo(ticket, now = new Date()) {
  const resolutionTarget = SLA_TARGET_MINUTES[ticket.priority]
  if (!resolutionTarget) return { state: "unknown", label: "—", targetMinutes: 0 }

  const targetMinutes = Math.round(resolutionTarget / 2)
  const holdMinutes = ticket.totalHoldMinutes ?? 0
  const responded = Boolean(ticket.firstRespondedAt)
  const endTime = responded ? new Date(ticket.firstRespondedAt) : now
  const elapsedMinutes = (endTime.getTime() - new Date(ticket.createdAt).getTime()) / 60000 - holdMinutes
  const diffMinutes = targetMinutes - elapsedMinutes

  if (diffMinutes >= 0) {
    return {
      state: responded ? "met" : "left",
      label: responded ? `Met with ${formatSlaDuration(diffMinutes)} to spare` : `${formatSlaDuration(diffMinutes)} left`,
      targetMinutes,
    }
  }
  return {
    state: responded ? "missed" : "overdue",
    label: responded ? `Missed by ${formatSlaDuration(-diffMinutes)}` : `Breached by ${formatSlaDuration(-diffMinutes)}`,
    targetMinutes,
  }
}

export const DOMAIN_OPTIONS = ["NDM AL", "NDM SL", "Other"]

export const TABLE_NAME_OPTIONS = [
  "default.icdm_icbw_cr",
  "twicloud.ipdk_ichm_combe",
  "etl_core_sgsn_ericsson_kpi_hourly",
  "default.etl_cell_5g_ran_ericsson_kpi_daily",
  "reference.core_control_table",
  "base.oss_core_vas_sms_msc_hh",
  "smy.etl_core_cs_nokia_gcs_dd",
]

export const DOMAIN_TABLE_NAMES = {
  "NDM AL": [
    "default.icdm_icbw_cr",
    "etl_core_sgsn_ericsson_kpi_hourly",
    "default.etl_cell_5g_ran_ericsson_kpi_daily",
    "base.oss_core_vas_sms_msc_hh",
  ],
  "NDM SL": [
    "twicloud.ipdk_ichm_combe",
    "reference.core_control_table",
    "smy.etl_core_cs_nokia_gcs_dd",
  ],
}

// Mock host inventory for the "IP Address" picker on the New/Add Issue dialog.
export const HOST_OPTIONS = [
  "192.0.2.13",
  "192.0.2.18",
  "192.0.2.19",
  "192.0.2.20",
  "192.0.2.21",
  "192.0.2.22",
  "192.0.2.4",
  "192.0.2.7",
  "192.0.2.10",
  "192.0.2.8",
]

// Mock table catalogue suggestions for the "Table Name" picker — filtered
// as-you-type on the New/Add Issue dialog.
export const TABLE_NAME_SUGGESTIONS = [
  ...TABLE_NAME_OPTIONS,
  "cube_smartcare_09_os_region_transpose_daily",
  "cube_smartcare_09_os_region_transpose_hourly",
  "cube_smartcare_14_akamai_transpose_region_daily",
  "cube_smartcare_14_akamai_transpose_region_hourly",
  "data_quality_core_icam_ran_sysinfo_all_view",
  "data_quality_dnd_bv_assurance_ibooster_summary",
  "data_quality_dnd_bv_assurance_performance_daily",
  "ran_cell_day_4g",
  "ran_cell_day_5g",
]

export const ISSUE_GRANULARITY_OPTIONS = ["Daily", "Weekly", "Monthly"]

export const PIC_OPTIONS = [
  "Bramantyo Adi",
  "Siti Nurhaliza",
  "Rahadian A.",
  "Nabila Putri",
  "Dewi Kartika",
  "Ivan Nurcahyo",
]

export const DOMAIN_PIC_MAP = {
  "NDM AL": ["Bramantyo Adi", "Siti Nurhaliza", "Nabila Putri"],
  "NDM SL": ["Rahadian A.", "Dewi Kartika", "Ivan Nurcahyo"],
}

export const PIC_PHONE_MAP = {
  "Bramantyo Adi": "+628123456701",
  "Siti Nurhaliza": "+628134567802",
  "Rahadian A.": "+628112345603",
  "Nabila Putri": "+628145678904",
  "Dewi Kartika": "+628156789005",
  "Ivan Nurcahyo": "+628167890106",
  "Muhammad Adrian": "+6281213778388",
}

export function picPhone(name) {
  return PIC_PHONE_MAP[name] ?? null
}

export function waLinkFromPhone(phone) {
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}`
}

export const REGION_OPTIONS = [
  "Nationwide",
  "Sumbagut",
  "Sumbagsel",
  "Sumbagteng",
  "Jabotabek",
  "Jabar",
  "Jateng-DIY",
  "Jatim",
  "Kalimantan",
  "Sulawesi",
  "Bali-Nusra",
  "Maluku-Papua",
]

export const DEFAULT_CATEGORY_TREE = [
  {
    name: "Network Data",
    children: [
      {
        name: "Data Quality",
        children: [{ name: "Completeness" }, { name: "Validity" }],
      },
      {
        name: "Data Ingestion",
        children: [{ name: "Format Data" }],
      },
      { name: "Keamanan dan akses table" },
    ],
  },
  {
    name: "Subscriber Data",
    children: [
      {
        name: "Data Quality",
        children: [{ name: "Completeness" }, { name: "Consistency" }],
      },
      {
        name: "Data Enrichment",
        children: [{ name: "Profile Matching" }],
      },
      { name: "Retention Policy" },
    ],
  },
  {
    name: "Billing Data",
    children: [
      {
        name: "Data Quality",
        children: [{ name: "Accuracy" }, { name: "Timeliness" }],
      },
      { name: "Reconciliation" },
    ],
  },
  {
    name: "Network Performance",
    children: [
      { name: "KPI Threshold" },
      { name: "Anomaly Detection" },
    ],
  },
  {
    name: "Master Data Management",
    children: [{ name: "Data Governance" }, { name: "Reference Table" }],
  },
]

function initialsOf(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function emailOf(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".")
  return `${slug}@example.com`
}

function avatarUrlOf(name) {
  if (!name) return null
  return `https://api.dicebear.com/10.x/thumbs/svg?seed=${encodeURIComponent(name)}`
}

const TICKETS_NOW_MS = Date.now()
const ticketMinutesAgo = (minutes) => new Date(TICKETS_NOW_MS - minutes * 60000).toISOString()
const DAY_MINUTES = 24 * 60

export const TICKETS = [
  {
    // P0, in progress, created 90m ago against a 60m target — SLA "Overdue by 30m".
    id: "NDQR20260730001",
    author: "Fengky Pratama",
    createdAt: ticketMinutesAgo(90),
    title: "issue_dummy",
    description:
      "Terdapat ketidaklengkapan data pada tabel default.icdm_icbw_cr yang menyebabkan validasi harian gagal.",
    category: { application: "Network Data", scope: "Data Quality", concern: "Completeness" },
    domain: "NDM AL",
    picCategory: "RAN",
    level: "L0",
    tableName: "default.icdm_icbw_cr",
    ticketFor: "self",
    issueOwner: "Fengky Pratama",
    pic: ["Bramantyo Adi", "Siti Nurhaliza", "Nabila Putri", "Antonio Nusa"],
    priority: "P0",
    createdBy: "non-system",
    resolvedAt: null,
    tags: ["ndm_speed_layer"],
    ipAddress: "192.0.2.4",
    status: STATUS.inProgress,
    upvotes: 1,
    views: 1,
    replies: [],
    resolution: null,
  },
  {
    // P0, in progress, created 35m ago against a 60m target — SLA "25m left".
    id: "NDQR20260731382",
    author: "Ivan Nurcahyo",
    createdAt: ticketMinutesAgo(35),
    title: "[MADING AKTIF] Kendala Data Incompleteness",
    description:
      "Ditemukan gap row count pada twicloud.ipdk_ichm_combe di window pukul 08:00-15:00. Perlu investigasi engine ingest.",
    category: { application: "Network Data", scope: "Data Quality", concern: "Completeness" },
    domain: "NDM SL",
    picCategory: "RAN",
    level: "L1",
    tableName: "twicloud.ipdk_ichm_combe",
    ticketFor: "other",
    issueOwner: "Bramantyo Adi",
    pic: ["Bramantyo Adi", "Rahadian A.", "Dewi Kartika"],
    priority: "P0",
    createdBy: "non-system",
    resolvedAt: null,
    tags: ["twicloud", "incompleteness"],
    ipAddress: "192.0.2.7",
    status: STATUS.inProgress,
    upvotes: 0,
    views: 450,
    replies: [
      {
        id: "r1",
        author: "Bramantyo Adi",
        createdAt: "2026-07-31T11:05:00",
        text: "Sudah cek di sisi engine, ada delay dari upstream kafka consumer.",
        image: null,
      },
    ],
    resolution: null,
  },
  {
    // P1, closed, resolved 150m after creation against a 120m target — SLA "Missed by 30m".
    id: "NDQR20260713092",
    author: "Rahadian A.",
    createdAt: ticketMinutesAgo(5 * DAY_MINUTES + 150),
    resolvedAt: ticketMinutesAgo(5 * DAY_MINUTES),
    title: "etl_core_sgsn_ericsson_kpi_hourly Reload & Reprocess",
    description:
      "Data KPI hourly perlu di-reload karena tanggal berhasil tidak konsisten dengan control table.",
    category: { application: "Network Data", scope: "Data Ingestion", concern: "Format Data" },
    domain: "NDM AL",
    picCategory: "CORE PS",
    level: "L0",
    tableName: "etl_core_sgsn_ericsson_kpi_hourly",
    ticketFor: "self",
    issueOwner: "Rahadian A.",
    pic: ["Rahadian A.", "Siti Nurhaliza", "Ivan Nurcahyo"],
    priority: "P1",
    createdBy: "non-system",
    tags: ["etl_core_sgsn", "reprocess"],
    ipAddress: "192.0.2.10",
    status: STATUS.closed,
    upvotes: 3,
    views: 1280,
    replies: [
      {
        id: "r1",
        author: "Rahadian A.",
        createdAt: "2026-07-13T09:20:00",
        text: "Sudah reload ulang tanggal 12-13 Juli.",
        image: null,
      },
      {
        id: "r2",
        author: "Siti Nurhaliza",
        createdAt: "2026-07-13T10:02:00",
        text: "Konfirmasi, row count sudah sesuai dengan control table sekarang.",
        image: null,
      },
    ],
    resolution: {
      rootCause: "Delay pada job reprocess harian yang tidak ter-trigger otomatis.",
      suspectSystem: "ETL Core SGSN Pipeline",
      resolutionNotes: "Reload & reprocess data tanggal 12-13 Juli, jadwal cron diperbaiki.",
    },
  },
  {
    // P0, open, created 10m ago against a 60m target — SLA "50m left".
    id: "NDQR20260728015",
    author: "Dewi Kartika",
    createdAt: ticketMinutesAgo(10),
    title: "Validity kpi RAN Ericsson turun drastis",
    description:
      "Nilai validity_kpi pada default.etl_cell_5g_ran_ericsson_kpi_daily turun dari 98% ke 61% sejak kemarin.",
    category: { application: "Network Data", scope: "Data Quality", concern: "Validity" },
    domain: "NDM AL",
    picCategory: "RAN",
    level: "L0",
    tableName: "default.etl_cell_5g_ran_ericsson_kpi_daily",
    ticketFor: "self",
    issueOwner: "Dewi Kartika",
    pic: ["Nabila Putri", "Antonio Nusa"],
    priority: "P0",
    createdBy: "non-system",
    resolvedAt: null,
    tags: ["ran_ericsson", "validity_kpi"],
    ipAddress: "192.0.2.8",
    status: STATUS.open,
    upvotes: 5,
    views: 210,
    replies: [],
    resolution: null,
  },
  {
    // P2, open, created 90m ago against a 240m target — SLA "2h 30m left".
    id: "NDQR20260726007",
    author: "Yoga Pratama",
    createdAt: ticketMinutesAgo(90),
    title: "Akses table reference.core_control_table ditolak",
    description:
      "Beberapa user group tidak bisa query reference.core_control_table sejak rotasi kredensial minggu lalu.",
    category: { application: "Network Data", scope: "Keamanan dan akses table", concern: "Access Control" },
    domain: "NDM SL",
    picCategory: "CORE PS",
    level: "L1",
    tableName: "reference.core_control_table",
    ticketFor: "other",
    issueOwner: "Siti Nurhaliza",
    pic: ["Siti Nurhaliza", "Bramantyo Adi", "Nabila Putri"],
    priority: "P2",
    createdBy: "non-system",
    resolvedAt: null,
    tags: ["access_denied", "core_control_table"],
    ipAddress: "192.0.2.12",
    status: STATUS.open,
    upvotes: 2,
    views: 88,
    replies: [],
    resolution: null,
  },
  {
    // P1, solved, resolved 100m after creation against a 120m target — SLA "Met with 20m to spare".
    id: "NDQR20260722044",
    author: "Nabila Putri",
    createdAt: ticketMinutesAgo(3 * DAY_MINUTES + 100),
    resolvedAt: ticketMinutesAgo(3 * DAY_MINUTES),
    title: "Format tanggal tidak konsisten di base.oss_core_vas_sms_msc_hh",
    description:
      "Kolom date_end memakai format campuran dd/mm/yyyy dan yyyy-mm-dd pada beberapa partisi.",
    category: { application: "Network Data", scope: "Data Ingestion", concern: "Format Data" },
    domain: "NDM AL",
    picCategory: "CORE CS",
    level: "L1",
    tableName: "base.oss_core_vas_sms_msc_hh",
    ticketFor: "self",
    issueOwner: "Nabila Putri",
    pic: ["Ivan Nurcahyo"],
    priority: "P1",
    createdBy: "non-system",
    tags: ["oss_core_vas", "format_date"],
    ipAddress: "192.0.2.11",
    status: STATUS.solved,
    upvotes: 4,
    views: 156,
    replies: [
      {
        id: "r1",
        author: "Nabila Putri",
        createdAt: "2026-07-22T17:00:00",
        text: "Attaching screenshot dari sample partisi yang bermasalah.",
        image: null,
      },
    ],
    resolution: null,
  },
  {
    // P2, closed, resolved 260m after creation against a 240m target — SLA "Missed by 20m".
    id: "NDQR20260710066",
    author: "Fengky Pratama",
    createdAt: ticketMinutesAgo(7 * DAY_MINUTES + 260),
    resolvedAt: ticketMinutesAgo(7 * DAY_MINUTES),
    title: "Duplicate rows pada smy.etl_core_cs_nokia_gcs_dd",
    description:
      "Ditemukan duplikasi baris pada window tanggal 8-9 Juli, kemungkinan re-ingest ganda.",
    category: { application: "Network Data", scope: "Data Quality", concern: "Completeness" },
    domain: "NDM SL",
    picCategory: "CORE CS",
    level: "L1",
    tableName: "smy.etl_core_cs_nokia_gcs_dd",
    ticketFor: "self",
    issueOwner: "Fengky Pratama",
    pic: ["Rahadian A.", "Dewi Kartika", "Ivan Nurcahyo"],
    priority: "P2",
    createdBy: "non-system",
    tags: ["core_cs_nokia", "duplicate"],
    ipAddress: "192.0.2.2",
    status: STATUS.closed,
    upvotes: 1,
    views: 342,
    replies: [
      {
        id: "r1",
        author: "Rahadian A.",
        createdAt: "2026-07-10T10:00:00",
        text: "Dedup job dijalankan manual, row count sudah normal.",
        image: null,
      },
    ],
    resolution: {
      rootCause: "Job re-ingest berjalan dua kali akibat retry otomatis tanpa idempotency check.",
      suspectSystem: "Core CS Nokia Ingest Pipeline",
      resolutionNotes: "Menambahkan idempotency key pada job ingest, dedup manual untuk data lama.",
    },
  },
  {
    // P1, open, created 200m ago against a 120m target — SLA "Overdue by 1h 20m".
    id: "NDQR20260705021",
    author: "Dewi Kartika",
    createdAt: ticketMinutesAgo(200),
    title: "Minor cosmetic mismatch pada validity_kpi dashboard",
    description:
      "Label kolom pada dashboard validity_kpi tidak konsisten dengan penamaan di tabel sumber, tidak berdampak ke data.",
    category: { application: "Network Data", scope: "Data Quality", concern: "Validity" },
    domain: "NDM SL",
    picCategory: "RAN",
    level: "L0",
    tableName: "default.icdm_validity_daily_chk",
    ticketFor: "self",
    issueOwner: "Dewi Kartika",
    pic: ["Nabila Putri", "Ivan Nurcahyo", "Bramantyo Adi"],
    priority: "P1",
    createdBy: "non-system",
    resolvedAt: null,
    tags: ["validity_kpi", "cosmetic"],
    ipAddress: "192.0.2.9",
    status: STATUS.open,
    upvotes: 0,
    views: 5,
    replies: [],
    resolution: null,
  },
  {
    // System-raised, P1, pending, created 10m ago against a 120m target — SLA "1h 50m left".
    id: "NDQR20260910101",
    author: "Indysystem",
    createdAt: ticketMinutesAgo(10),
    title: "Automated Incident: Completeness BELOW_THRESHOLD (Quality Rate: 40.61%)",
    description:
      "Automated quality check flagged completeness below threshold on cube_smartcare_09_os_region_transpose_daily.",
    category: { application: "Network Data", scope: "Data Quality", concern: "Completeness" },
    domain: "NDM SL",
    picCategory: "RAN",
    level: "L0",
    tableName: "cube_smartcare_09_os_region_transpose_daily",
    ticketFor: "self",
    issueOwner: "Indysystem",
    pic: ["Bramantyo Adi", "Siti Nurhaliza"],
    priority: "P1",
    createdBy: "system",
    resolvedAt: null,
    tags: ["ran", "ndm_speed_layer", "kendala"],
    ipAddress: "192.0.2.18",
    status: STATUS.pending,
    upvotes: 0,
    views: 0,
    replies: [],
    resolution: null,
  },
  {
    // System-raised, P2, pending, created 260m ago against a 240m target — SLA "Overdue by 20m".
    id: "NDQR20260910102",
    author: "Indysystem",
    createdAt: ticketMinutesAgo(260),
    title: "Automated Incident: Validity BELOW_THRESHOLD (Quality Rate: 87.27%)",
    description:
      "Automated quality check flagged validity below threshold on data_quality_core_icam_ran_sysinfo_all_view.",
    category: { application: "Network Data", scope: "Data Quality", concern: "Validity" },
    domain: "NDM AL",
    picCategory: "RAN",
    level: "L0",
    tableName: "data_quality_core_icam_ran_sysinfo_all_view",
    ticketFor: "self",
    issueOwner: "Indysystem",
    pic: ["Rahadian A.", "Dewi Kartika"],
    priority: "P2",
    createdBy: "system",
    resolvedAt: null,
    tags: ["ran", "ndm_access_layer", "kendala"],
    ipAddress: "192.0.2.19",
    status: STATUS.pending,
    upvotes: 0,
    views: 0,
    replies: [],
    resolution: null,
  },
]

// Mock "INDY Assistant" AI insights — recurrence history, root cause analysis,
// and duplicate/similar-incident detection for the ticket detail page.
export const TICKET_AI_INSIGHTS = {
  NDQR20260730001: {
    occurrenceCount: 4,
    firstOccurred: "2026-03-12",
    lastOccurred: "2026-07-18",
    pattern:
      "Recurs roughly every 4-6 weeks after the icdm_icbw_cr partition backfill job runs, most often on the Thursday batch cycle.",
    rootCause: {
      primary:
        "Upstream ICBW extractor drops rows when source CDC lag exceeds 15 minutes, so partitions get marked complete before all shards land.",
      confidence: 82,
      contributingFactors: [
        "CDC lag threshold isn't enforced before a partition is closed",
        "No row-count reconciliation against the source system before validation runs",
      ],
    },
    pastIncidents: [
      {
        id: "NDQR20260320014",
        date: "2026-03-20",
        summary: "Same table flagged incomplete after a CDC lag spike; resolved by re-running the extractor once lag cleared.",
        resolutionTime: "6h",
      },
      {
        id: "NDQR20260502031",
        date: "2026-05-02",
        summary: "Partition closed early during a source maintenance window; fixed with a manual backfill.",
        resolutionTime: "9h",
      },
      {
        id: "NDQR20260718058",
        date: "2026-07-18",
        summary: "Recurrence after an extractor config rollback; resolved by re-applying the CDC lag guard.",
        resolutionTime: "5h",
      },
    ],
    duplicate: {
      isDuplicate: false,
      relatedTicketId: "NDQR20260718058",
      similarity: 71,
      note: "No open duplicate found. Closest match is NDQR20260718058 (closed) — same table, different trigger.",
    },
    duplicateDetection: {
      resolutionStatus: "recurring_resolved",
      similarityThreshold: 0.6,
      similarTickets: [
        {
          code: "NDQR20260718058",
          similarity: 0.71,
          matchedCriteria: {
            table: { matched: true, sharedTables: ["default.icdm_icbw_cr"] },
            category: { matched: true, value: "NDM AL" },
            dimension: { matched: true, value: "Completeness" },
            period: { matched: false, value: null },
          },
          resolved: true,
          resolutionNote: "Re-applied CDC lag guard after extractor config rollback.",
          llmVerification: {
            verdict: "agree",
            confidence: 80,
            note: "Same table and dimension, same closed resolution path.",
          },
        },
        {
          code: "NDQR20260502031",
          similarity: 0.64,
          matchedCriteria: {
            table: { matched: true, sharedTables: ["default.icdm_icbw_cr"] },
            category: { matched: true, value: "NDM AL" },
            dimension: { matched: true, value: "Completeness" },
            period: { matched: false, value: null },
          },
          resolved: true,
          resolutionNote: "Fixed with a manual backfill during a source maintenance window.",
          llmVerification: {
            verdict: "agree",
            confidence: 75,
            note: "Both incidents trace back to the same partition-closure gap.",
          },
        },
      ],
      narrative:
        "Two closed tickets share this table and dimension, both resolved by re-applying the CDC lag guard or a manual backfill — the same fix is likely to work again.",
    },
    clustering: {
      found: true,
      relatedTickets: [
        { code: "NDQR20260320014", description: "Same table flagged incomplete after a CDC lag spike." },
        { code: "NDQR20260502031", description: "Partition closed early during a source maintenance window." },
      ],
      sharedSignals: {
        tables: ["default.icdm_icbw_cr"],
        problemTypes: ["Completeness"],
      },
      confidence: 82,
      narrative:
        "This ticket clusters with two prior incidents on the same table, all driven by CDC lag around the Thursday batch cycle. Worth checking the upstream extractor before treating this as a new root cause.",
    },
    recommendedAction:
      "Re-apply the CDC lag guard used in NDQR20260718058 and add row-count reconciliation before the partition is marked complete. Based on history, expect a 5-9h resolution time.",
  },
  NDQR20260710066: {
    occurrenceCount: 2,
    firstOccurred: "2026-05-14",
    lastOccurred: "2026-07-10",
    pattern: "Second time in 8 weeks this table has shown duplicate rows, both times after an automatic ingest retry.",
    rootCause: {
      primary: "Ingest job retries on timeout without an idempotency key, re-writing rows that already landed.",
      confidence: 88,
      contributingFactors: ["Retry policy has no dedup/idempotency guard", "No unique-key constraint on the target table"],
    },
    pastIncidents: [
      {
        id: "NDQR20260514019",
        date: "2026-05-14",
        summary: "Duplicate rows from a retried ingest job; deduped manually, no idempotency fix applied at the time.",
        resolutionTime: "4h",
      },
    ],
    duplicate: {
      isDuplicate: false,
      relatedTicketId: "NDQR20260514019",
      similarity: 93,
      note: "93% similar to NDQR20260514019 (closed) — same root cause, fix from that ticket was never made permanent.",
    },
    duplicateDetection: {
      resolutionStatus: "recurring_unresolved",
      similarityThreshold: 0.6,
      similarTickets: [
        {
          code: "NDQR20260514019",
          similarity: 0.93,
          matchedCriteria: {
            table: { matched: true, sharedTables: ["core_cs_nokia"] },
            category: { matched: true, value: "CORE CS" },
            dimension: { matched: true, value: "Uniqueness" },
            period: { matched: false, value: null },
          },
          resolved: true,
          resolutionNote: "Deduped manually; idempotency fix was never made permanent.",
          llmVerification: {
            verdict: "agree",
            confidence: 90,
            note: "Same table, same trigger (retry without idempotency key), fix never landed.",
          },
        },
      ],
      narrative:
        "93% match to a ticket closed two months ago with the same root cause. The manual dedup used there was never turned into a permanent fix, which is why this recurred.",
    },
    clustering: {
      found: false,
      relatedTickets: [],
      sharedSignals: { tables: [], problemTypes: [] },
      confidence: 0,
      narrative: "No other open tickets share this table or problem type right now — this looks isolated.",
    },
    recommendedAction:
      "Add an idempotency key to the ingest job's retry path so this doesn't recur a third time. Previous fix was manual dedup only.",
  },
}

const DEFAULT_AI_INSIGHT = {
  occurrenceCount: 1,
  firstOccurred: null,
  lastOccurred: null,
  pattern: "This is the first reported incident on this table — no recurring pattern detected yet.",
  rootCause: {
    primary: "Not enough historical data to determine a root cause with confidence. Flagged for manual investigation.",
    confidence: 35,
    contributingFactors: [],
  },
  pastIncidents: [],
  duplicate: { isDuplicate: false, relatedTicketId: null, similarity: 0, note: "No similar tickets found in the last 90 days." },
  duplicateDetection: {
    resolutionStatus: "no_match",
    similarityThreshold: 0.6,
    similarTickets: [],
    narrative: "No similar tickets found in the last 90 days.",
  },
  clustering: {
    found: false,
    relatedTickets: [],
    sharedSignals: { tables: [], problemTypes: [] },
    confidence: 0,
    narrative: "This is the first reported incident on this table — no recurring pattern detected yet.",
  },
  recommendedAction: "Assign a PIC to investigate the root cause directly; no prior playbook exists for this table yet.",
}

export function getTicketInsight(ticket) {
  if (!ticket) return null
  const preset = TICKET_AI_INSIGHTS[ticket.id]
  if (preset) return preset
  return { ...DEFAULT_AI_INSIGHT, firstOccurred: ticket.createdAt.slice(0, 10), lastOccurred: ticket.createdAt.slice(0, 10) }
}

export function ticketAuthorInitials(name) {
  return initialsOf(name)
}

export function ticketAuthorEmail(name) {
  return emailOf(name)
}

export function ticketAuthorAvatarUrl(name) {
  return avatarUrlOf(name)
}

export function getTicketById(id) {
  return TICKETS.find((t) => t.id === id)
}

// Returns a ticket's concrete issue rows (host/table/period). Tickets created
// via the New/Duplicate Ticket dialog already carry a full `issues` array;
// older mock tickets only have a single ipAddress/tableName pair, so this
// derives an equivalent single-row list from those instead.
export function getTicketIssues(ticket) {
  if (!ticket) return []
  if (Array.isArray(ticket.issues) && ticket.issues.length > 0) return ticket.issues
  const day = ticket.createdAt ? ticket.createdAt.slice(0, 10) : ""
  return [
    {
      id: `${ticket.id}-issue-1`,
      ipAddress: ticket.ipAddress ?? "",
      tableName: ticket.tableName ?? "",
      granularity: "Daily",
      from: day,
      to: day,
    },
  ]
}

// Builds the "Ticket created" History tab entry — a full snapshot of the
// fields the ticket was raised with.
function buildCreatedHistoryEntry(ticket, at) {
  const resolutionTarget = SLA_TARGET_MINUTES[ticket.priority]
  const responseTarget = resolutionTarget ? Math.round(resolutionTarget / 2) : null
  return {
    id: `${ticket.id}-history-created`,
    actor: ticket.author,
    at,
    kind: "created",
    snapshot: {
      status: STATUS_META[STATUS.open].label,
      priority: ticket.priority,
      sla: resolutionTarget ? `${ticket.priority} (${responseTarget}m / ${resolutionTarget}m)` : "—",
      level: (ticket.level ?? "L0").toUpperCase(),
      domain: ticket.domain,
      scope: ticket.category?.scope ?? "—",
      concern: ticket.category?.concern ?? "—",
      category: ticket.picCategory ?? ticket.category?.application ?? "—",
      description: ticket.description,
      attachmentCount: ticket.screenshot ? 1 : 0,
      resolutionFileCount: 0,
      issues: getTicketIssues(ticket),
    },
  }
}

// Returns a ticket's History tab entries. Tickets created via the
// New/Duplicate Ticket dialog carry a real, ever-growing `history` array
// (seeded below, appended to by every workflow action on the detail page).
// Older mock tickets predate that array, so this synthesizes an equivalent
// "created" entry — plus one status-change entry if the ticket has since
// moved on from Open — from their existing fields.
export function getTicketHistory(ticket) {
  if (!ticket) return []
  if (Array.isArray(ticket.history) && ticket.history.length > 0) return ticket.history

  const entries = [buildCreatedHistoryEntry(ticket, ticket.createdAt)]
  if (ticket.status !== STATUS.open) {
    entries.push({
      id: `${ticket.id}-history-status`,
      actor: ticket.author,
      at: ticket.resolvedAt ?? ticket.createdAt,
      kind: "change",
      changes: [{ label: "STATUS", from: STATUS_META[STATUS.open].label, to: STATUS_META[ticket.status].label }],
    })
  }
  return entries
}

// Builds a full ticket record from a New/Duplicate Ticket dialog draft,
// assigning a fresh ID and the workflow defaults every ticket starts with.
// Shared by IncidentManagementPage (New Ticket) and IncidentManagementDetailPage (Duplicate).
export function buildTicketFromDraft(existingTickets, draft) {
  const now = new Date()
  const datePrefix = `NDQR${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`
  const sameDayCount = existingTickets.filter((t) => t.id.startsWith(datePrefix)).length
  const ticket = {
    id: `${datePrefix}${String(sameDayCount + 1).padStart(3, "0")}`,
    author: CURRENT_USER,
    createdAt: now.toISOString(),
    status: STATUS.open,
    createdBy: "non-system",
    resolvedAt: null,
    firstRespondedAt: null,
    totalHoldMinutes: 0,
    holdStartedAt: null,
    previousStatus: null,
    level: "L0",
    upvotes: 0,
    views: 0,
    replies: [],
    resolution: null,
    ...draft,
    pic: DOMAIN_PIC_MAP[draft.domain] ?? [],
  }
  ticket.history = [buildCreatedHistoryEntry(ticket, ticket.createdAt)]
  return ticket
}

export function flattenCategoryLeaves(tree) {
  const leaves = []
  const walk = (nodes, path) => {
    for (const node of nodes) {
      const nextPath = [...path, node.name]
      if (node.children && node.children.length > 0) {
        walk(node.children, nextPath)
      } else {
        leaves.push(nextPath.join(" / "))
      }
    }
  }
  walk(tree, [])
  return leaves
}
