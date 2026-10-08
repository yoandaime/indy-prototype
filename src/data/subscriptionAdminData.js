// Mock data for the Subscription page's admin "Overview" tab — which users
// subscribe to which tables, and the aggregate stats/charts derived from it.

import { SUBSCRIPTION_TABLES } from "./subscriptionTables"

export const ADMIN_USERS = [
  { id: 1, name: "Antonio Nusa", role: "Admin", subscribedTableIds: [1, 2, 3, 14, 15, 21, 22, 28, 33, 37] },
  { id: 2, name: "Sarah Putri", role: "Data Analyst", subscribedTableIds: [1, 5, 9, 13, 16, 19, 23] },
  { id: 3, name: "Budi Santoso", role: "Network Engineer", subscribedTableIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  { id: 4, name: "Fajar Wibowo", role: "Data Analyst", subscribedTableIds: [16, 17, 18, 19, 20, 21, 22] },
  { id: 5, name: "Rina Amalia", role: "Viewer", subscribedTableIds: [1, 3, 33, 34, 37] },
  { id: 6, name: "Dewi Kartika", role: "Data Analyst", subscribedTableIds: [2, 6, 10, 14, 18] },
  { id: 7, name: "Ivan Nurcahyo", role: "Network Engineer", subscribedTableIds: [3, 7, 11, 15, 19, 23, 27] },
  { id: 8, name: "Siti Nurhaliza", role: "Viewer", subscribedTableIds: [4, 8, 12] },
  { id: 9, name: "Bramantyo Adi", role: "Admin", subscribedTableIds: [1, 5, 9, 13, 17, 21, 25, 29, 33, 37] },
  { id: 10, name: "Nabila Putri", role: "Data Analyst", subscribedTableIds: [2, 6, 10, 14] },
  { id: 11, name: "Rahadian Aditya", role: "Network Engineer", subscribedTableIds: [16, 20, 24, 28, 32, 36, 40] },
  { id: 12, name: "Yoga Pratama", role: "Viewer", subscribedTableIds: [3, 7] },
  { id: 13, name: "Maya Sari", role: "Data Analyst", subscribedTableIds: [11, 15, 19, 23, 27, 31] },
  { id: 14, name: "Fikri Ramadhan", role: "Network Engineer", subscribedTableIds: [1, 2, 3, 4, 5, 6, 7, 8] },
]

export const ROLE_OPTIONS = ["Admin", "Data Analyst", "Network Engineer", "Viewer"]

const DEPARTMENTS = [
  "Platform Operations",
  "Data Engineering",
  "Network Operations",
  "Data Analytics",
  "IT Governance",
]

const OFFICES = ["Head Office, Jakarta", "Regional Office, Surabaya", "Regional Office, Bandung"]

// Mock profile fields for the user detail view — derived deterministically
// from the user's name/id rather than stored, since ADMIN_USERS only tracks
// what the rest of the page actually needs (name, role, subscriptions).
export function getUserProfileFields(user) {
  const nameParts = user.name.toLowerCase().split(/\s+/)
  return {
    domainUser: nameParts.join(""),
    email: `${nameParts.join(".")}@indy.co.id`,
    department: DEPARTMENTS[user.id % DEPARTMENTS.length],
    office: OFFICES[user.id % OFFICES.length],
  }
}

const TABLE_BY_ID = new Map(SUBSCRIPTION_TABLES.map((table) => [table.id, table]))

export function getUserSubscribedTables(user) {
  return user.subscribedTableIds.map((id) => TABLE_BY_ID.get(id)).filter(Boolean)
}

// Deterministic 32-char hex digest — stands in for a real embed key/hash
// backend so each user gets a stable, distinct-looking dq_embed_* key.
function hashHex(seed, length) {
  let h1 = 0xdeadbeef ^ seed.length
  let h2 = 0x41c6ce57 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const hex = (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0")
  return (hex + hex).slice(0, length)
}

export function getUserEmbedKey(user) {
  return `dq_embed_${hashHex(user.name, 32)}`
}

// Minutes since the user's key was generated — deterministic per id so it
// doesn't jump around on every render, spread across the last few days.
export function getUserKeyGeneratedMinutesAgo(user) {
  return (user.id * 137) % (3 * 24 * 60)
}

export function formatRelativeTime(minutesAgo) {
  if (minutesAgo < 1) return "just now"
  if (minutesAgo < 60) return `${minutesAgo} min${minutesAgo === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutesAgo / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// Absolute "DD Mon YYYY HH:MM" timestamp — matches the format requested for
// the API Activity log (as opposed to formatRelativeTime's "X mins ago",
// used by the subscribe/token feeds).
export function formatAbsoluteDateTime(minutesAgo) {
  const d = new Date(Date.now() - minutesAgo * 60 * 1000)
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${d.getDate()} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()} ${hh}:${mm}`
}

const DEVICE_POOL = ["Chrome / macOS", "Firefox / Windows", "Safari / iOS", "Edge / Windows", "Chrome / Android"]

// Synthetic API request log (email, IP, timestamp, device) — stands in for
// real access logs, so the admin "List Activity" tab has an API Activity
// table to audit which endpoints users' embed keys have been hitting.
export function getAllApiActivity() {
  const entries = []

  for (const user of ADMIN_USERS) {
    const { email } = getUserProfileFields(user)
    const hitCount = 2 + (user.id % 3)
    for (let i = 0; i < hitCount; i++) {
      const octetSeed = hashHex(`${user.name}-${i}`, 8)
      entries.push({
        id: `${user.id}-api-${i}`,
        user,
        email,
        ipAddress: `192.${parseInt(octetSeed.slice(0, 2), 16)}.${parseInt(octetSeed.slice(2, 4), 16)}.${parseInt(octetSeed.slice(4, 6), 16)}`,
        minutesAgo: 12 + user.id * 9 + i * 47,
        device: DEVICE_POOL[(user.id + i) % DEVICE_POOL.length],
      })
    }
  }

  return entries.sort((a, b) => a.minutesAgo - b.minutesAgo)
}

// Synthetic subscribe/unsubscribe history built from the user's current
// subscription list — batches it into a handful of past events so the
// activity log has something plausible to show per user. Resolves table
// names up front since the log reads better by name than by raw id.
export function getUserActivityLog(user) {
  const ids = user.subscribedTableIds
  const entries = []
  let minutesAgo = 22 + ((user.id * 5) % 20)

  // Bramantyo Adi's history opens with a recent bulk-subscribe event across
  // all his tables at once — lands near the top of the global activity feed
  // (positions ~2-5, unlike Budi Santoso's older bulk-onboarding example
  // below, which sorts near the bottom) so the "+N more" overflow badge is
  // visible without scrolling.
  if (user.id === 9) {
    entries.push({
      id: `${user.id}-bulk-recent`,
      type: "subscribed",
      tableNames: ids.map((id) => TABLE_BY_ID.get(id)?.name ?? `#${id}`),
      minutesAgo: 25,
    })
  }

  for (let i = 0; i < Math.min(5, Math.ceil(ids.length / 2)); i++) {
    const batch = ids.slice(i * 2, i * 2 + (i % 3 === 0 ? 1 : 2))
    if (batch.length === 0) break
    entries.push({
      id: `${user.id}-${i}`,
      type: i % 3 === 1 ? "unsubscribed" : "subscribed",
      tableNames: batch.map((id) => TABLE_BY_ID.get(id)?.name ?? `#${id}`),
      minutesAgo,
    })
    minutesAgo += 15 + i * 10
  }

  // Budi Santoso's history also includes a large bulk-subscribe event (his
  // whole starting table list, subscribed at once) — a realistic example of
  // a batch too big to list inline, so the activity feed's badge list has a
  // case to demonstrate its "+N more" overflow treatment against.
  if (user.id === 3) {
    entries.push({
      id: `${user.id}-bulk-onboarding`,
      type: "subscribed",
      tableNames: ids.map((id) => TABLE_BY_ID.get(id)?.name ?? `#${id}`),
      minutesAgo: minutesAgo + 60 * 24 * 3,
    })
  }

  return entries
}

// Flattens every user's subscribe/unsubscribe history into one global feed,
// tagged with the user it belongs to — powers the admin "List Activity" tab's
// Subscription Activity list.
export function getAllSubscriptionActivity() {
  return ADMIN_USERS.flatMap((user) => getUserActivityLog(user).map((entry) => ({ ...entry, user }))).sort(
    (a, b) => a.minutesAgo - b.minutesAgo
  )
}

// Synthetic embed-key lifecycle events per user (generated / regenerated /
// revoked) — deterministic from the user's id and their real embed key/
// generated-at values, so it stays consistent with what UserDetailView shows.
export function getUserTokenActivityLog(user) {
  const embedKey = getUserEmbedKey(user)
  const tokenPreview = embedKey.slice(0, 18)
  const generatedMinutesAgo = getUserKeyGeneratedMinutesAgo(user)
  const entries = [
    { id: `${user.id}-token-generated`, type: "generated", tokenPreview, minutesAgo: generatedMinutesAgo + 90 },
  ]

  if (user.id % 3 !== 0) {
    entries.push({
      id: `${user.id}-token-regenerated`,
      type: "regenerated",
      tokenPreview,
      minutesAgo: generatedMinutesAgo,
    })
  }

  if (user.id % 7 === 0) {
    entries.push({
      id: `${user.id}-token-revoked`,
      type: "revoked",
      tokenPreview,
      minutesAgo: Math.max(5, generatedMinutesAgo - 40),
    })
  }

  return entries
}

// Global feed version of getUserTokenActivityLog, for the "List Activity"
// tab's Token Activity list.
export function getAllTokenActivity() {
  return ADMIN_USERS.flatMap((user) => getUserTokenActivityLog(user).map((entry) => ({ ...entry, user }))).sort(
    (a, b) => a.minutesAgo - b.minutesAgo
  )
}

// Aggregates every user's subscriptions into the stats/rankings the Overview
// tab renders — computed from ADMIN_USERS rather than hardcoded so it can't
// drift out of sync with the per-user lists above.
export function getAdminOverviewStats() {
  const appCounts = new Map()
  const tableCounts = new Map()
  let totalSubscriptions = 0

  for (const user of ADMIN_USERS) {
    for (const table of getUserSubscribedTables(user)) {
      totalSubscriptions += 1
      appCounts.set(table.app, (appCounts.get(table.app) ?? 0) + 1)
      tableCounts.set(table.id, (tableCounts.get(table.id) ?? 0) + 1)
    }
  }

  const topApps = [...appCounts.entries()]
    .map(([app, count]) => ({ app, count }))
    .sort((a, b) => b.count - a.count)

  const topTables = [...tableCounts.entries()]
    .map(([tableId, count]) => ({ table: TABLE_BY_ID.get(tableId), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalUsers: ADMIN_USERS.length,
    totalSubscriptions,
    mostSubscribedApp: topApps[0] ?? null,
    mostSubscribedTable: topTables[0] ?? null,
    topApps,
    topTables,
  }
}

// Which users subscribe to a given table — the inverse of
// getUserSubscribedTables, used by the "List Table" admin view.
export function getTableSubscribers(tableId) {
  return ADMIN_USERS.filter((user) => user.subscribedTableIds.includes(tableId))
}

// Mock general usage / data-quality-activity stats for the "Platform Activity
// Summary" section of the User Management overview. Not derived from
// ADMIN_USERS — stands in for analytics the backend will eventually supply.
export function getPlatformActivityStats() {
  return {
    avgLoginMinutes: 134.19,
    loginDurationBuckets: [
      { label: "0 - 30", count: 14 },
      { label: "31 - 60", count: 2 },
      { label: "61 - 90", count: 1 },
      { label: "91 - 120", count: 0 },
      { label: "121 - 150", count: 0 },
      { label: "151 - 210", count: 0 },
      { label: ">210", count: 16 },
    ],
    visitorTrend: {
      hours: [
        "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
        "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
      ],
      visitors: [12, 9, 14, 12, 11, 10, 7, 6, 6, 5, 4, 3],
    },
    dimensionPerApp: [
      { label: "Completeness", count: 4 },
      { label: "Accuracy", count: 9 },
      { label: "Validity", count: 3 },
      { label: "Timeliness", count: 6 },
      { label: "Consistency", count: 9 },
      { label: "Uniqueness", count: 5 },
    ],
    dimensionPerCategory: [
      { label: "Completeness", count: 6 },
      { label: "Accuracy", count: 10 },
      { label: "Validity", count: 3 },
      { label: "Timeliness", count: 7 },
      { label: "Consistency", count: 10 },
      { label: "Uniqueness", count: 6 },
    ],
  }
}
