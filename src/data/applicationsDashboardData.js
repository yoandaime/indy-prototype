// Mock data for the Applications → Main Dashboard "Dimensional View" screen.

export const DIMENSIONS = ["Completeness", "Timeliness"]
export const GRANULARITIES = ["Daily", "Weekly", "Monthly"]
export const LAYERS = ["All Layer", "Speed Layer", "Batch Layer"]

export const DATE_CHIPS = ["8 July 2025", "9 July 2025", "10 July 2025", "11 July 2025", "12 July 2025"]

export const TREND_DATES = [
  "1 Jul 2025",
  "2 Jul 2025",
  "3 Jul 2025",
  "4 Jul 2025",
  "5 Jul 2025",
  "6 Jul 2025",
  "7 Jul 2025",
]

// Same score bands used across INDY (poor/average/good/excellent), applied
// to a light table-cell background instead of a badge.
export function tierForScore(score) {
  if (score >= 96) return { bg: "bg-blue-50", text: "text-blue-700" }
  if (score >= 90) return { bg: "bg-emerald-50", text: "text-emerald-700" }
  if (score >= 80) return { bg: "bg-amber-50", text: "text-amber-700" }
  return { bg: "bg-red-50", text: "text-red-700" }
}

export const APPLICATION_ROWS = [
  { key: "ndm", name: "NDM", completeness: 76.0, timeliness: 91.22 },
  { key: "ipdm", name: "IPDM", completeness: 80.82, timeliness: 97.82 },
  { key: "acs-axios", name: "ACS AXIOS", completeness: 91.22, timeliness: 76.0 },
  { key: "inap", name: "INAP", completeness: 97.82, timeliness: 97.82 },
  { key: "avp", name: "AVP", completeness: 80.82, timeliness: 91.22 },
]

export const CATEGORY_ROWS = [
  { key: "ran", name: "RAN", completeness: 80.82, timeliness: 97.82 },
  { key: "transport-ran", name: "TRANSPORT RAN", completeness: 76.0, timeliness: 91.22 },
  { key: "core-ps", name: "CORE PS", completeness: 91.22, timeliness: 76.0 },
  { key: "fmc", name: "FMC", completeness: 80.82, timeliness: 91.22 },
]

// Deterministic mock trend series per app/category + dimension — stands in
// for a real metrics API. Keeps values in a believable 60–100% band.
export function getTrendSeries(seedKey, dimension) {
  const seed = [...`${seedKey}-${dimension}`].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return TREND_DATES.map((_, i) => {
    const wobble = Math.sin((seed + i) * 1.3) * 12
    const value = Math.min(100, Math.max(60, 82 + wobble))
    return Math.round(value * 100) / 100
  })
}
