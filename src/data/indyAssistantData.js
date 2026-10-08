// Mock data for the INDY Assistant chat page — no backend/model wired up yet.

export const INDY_ASSISTANT_USER = "Antonio"

export const INDY_ASSISTANT_HISTORY = [
  {
    id: "conv-1",
    title: "What makes the sequence one two three four significant?",
    messages: [
      {
        id: "conv-1-u1",
        role: "user",
        text: "What makes the sequence one two three four significant?",
      },
      {
        id: "conv-1-a1",
        role: "assistant",
        responseTimeMs: 1380,
        text: `Great question! The sequence 1, 2, 3, 4 looks simple, but a few things make it worth thinking about:

**Foundational ordering** — it's the simplest example of a strictly increasing sequence, which is why it's used to teach counting and order early on.

**Base building block** — many patterns (arithmetic progressions, indexing schemes, version numbers) start from this exact sequence before adding complexity.

**Cognitive anchor** — short, ordered sequences like this are easy to recall, which is part of why it shows up so often in examples and demos.

Would you like me to compare it to other classic sequences like Fibonacci or the primes?`,
      },
    ],
  },
  {
    id: "conv-2",
    title: "Why is it one two three four?",
    messages: [
      {
        id: "conv-2-u1",
        role: "user",
        text: "Why is it one two three four?",
      },
      {
        id: "conv-2-a1",
        role: "assistant",
        responseTimeMs: 960,
        text: `There isn't a hidden trick here — 1, 2, 3, 4 is just the first four positive integers, each one greater than the last by exactly 1.

A few ways to frame "why":
1. **Definition** — integers are ordered by the successor function: each number is the previous one plus one.
2. **Convention** — we start counting at 1 (or 0, depending on context) because that's the smallest unit we typically care about.
3. **Consistency** — keeping the step size constant (+1) is what makes it a sequence rather than an arbitrary list.

If you had a specific context in mind (a countdown, a list index, song lyrics), let me know and I can tailor the explanation.`,
      },
    ],
  },
  {
    id: "conv-3",
    title: "Can you explain the importance of one two three four?",
    messages: [
      {
        id: "conv-3-u1",
        role: "user",
        text: "Can you explain the importance of one two three four?",
      },
      {
        id: "conv-3-a1",
        role: "assistant",
        responseTimeMs: 1720,
        text: `Sure — beyond being simple counting numbers, 1-2-3-4 shows up in a lot of practical places:

- **Music** — it's the standard count-in musicians and drummers use to set tempo before a song starts.
- **Software** — indexes, iteration counters, and step numbers in tutorials almost always start with this exact sequence.
- **Learning** — it's often the first sequence children learn, making it a benchmark for early numeracy.

So while the numbers themselves are basic, the sequence matters because it's the reference point almost every other counting pattern builds on.`,
      },
    ],
  },
  {
    id: "conv-4",
    title: "What's today's data quality status for NDM tables?",
    messages: [
      {
        id: "conv-4-u1",
        role: "user",
        text: "What's today's data quality status for NDM tables?",
      },
      {
        id: "conv-4-a1",
        role: "assistant",
        responseTimeMs: 1120,
        text: `Here's the data quality snapshot across NDM tables for today (2026-09-09):`,
        stats: [
          { label: "Tables Monitored", value: "128", deltaLabel: "+4 new today", deltaDirection: "up", tone: "neutral" },
          { label: "Checks Passed", value: "96.4%", deltaLabel: "+1.2% vs yesterday", deltaDirection: "up", tone: "positive" },
          { label: "Checks Failed", value: "14", deltaLabel: "-3 vs yesterday", deltaDirection: "down", tone: "positive" },
          { label: "Critical Alerts", value: "3", deltaLabel: "+1 vs yesterday", deltaDirection: "up", tone: "negative" },
          { label: "Avg Completeness", value: "97.2%", deltaLabel: "+0.4% vs yesterday", deltaDirection: "up", tone: "positive" },
          { label: "Avg Validity", value: "94.5%", deltaLabel: "-0.8% vs yesterday", deltaDirection: "down", tone: "negative" },
        ],
        followUp:
          "Most of the failures are concentrated in the NDM AL domain. Want me to break it down table by table?",
      },
      {
        id: "conv-4-u2",
        role: "user",
        text: "Yes, can you break down the failed checks by table, with row-level detail?",
      },
      {
        id: "conv-4-a2",
        role: "assistant",
        responseTimeMs: 1580,
        text: `Here are the 14 checks that failed today, ordered by severity:`,
        table: {
          columns: [
            "Table Name",
            "Domain",
            "Check Type",
            "Failed Rows",
            "Total Rows",
            "Failure Rate",
            "Severity",
            "Last Checked",
            "Assigned PIC",
          ],
          rows: [
            ["default.icdm_icbw_cr", "NDM AL", "Completeness", "12,480", "148,200", "8.4%", "Critical", "2026-09-09 06:02", "Bramantyo Adi"],
            ["default.etl_cell_5g_ran_ericsson_kpi_daily", "NDM AL", "Validity", "6,730", "212,900", "3.2%", "Critical", "2026-09-09 05:41", "Nabila Putri"],
            ["twicloud.ipdk_ichm_combe", "NDM SL", "Completeness", "3,105", "98,760", "3.1%", "High", "2026-09-09 06:15", "Rahadian A."],
            ["etl_core_sgsn_ericsson_kpi_hourly", "NDM AL", "Freshness", "1,240", "45,300", "2.7%", "High", "2026-09-09 07:00", "Siti Nurhaliza"],
            ["smy.etl_core_cs_nokia_gcs_dd", "NDM SL", "Uniqueness", "890", "51,020", "1.7%", "High", "2026-09-09 04:58", "Dewi Kartika"],
            ["base.oss_core_vas_sms_msc_hh", "NDM AL", "Format Data", "760", "88,410", "0.9%", "Medium", "2026-09-09 06:30", "Ivan Nurcahyo"],
            ["reference.core_control_table", "NDM SL", "Schema Drift", "42", "12,050", "0.3%", "Medium", "2026-09-09 03:20", "Siti Nurhaliza"],
            ["default.icdm_validity_daily_chk", "NDM SL", "Validity", "615", "64,880", "0.9%", "Medium", "2026-09-09 05:05", "Nabila Putri"],
            ["staging.icdm_icbw_cr_v2", "NDM AL", "Completeness", "310", "148,200", "0.2%", "Low", "2026-09-09 06:03", "Bramantyo Adi"],
            ["reference.pic_category_lookup", "NDM SL", "Consistency", "18", "3,204", "0.6%", "Low", "2026-09-09 02:45", "Rahadian A."],
            ["etl_core_sgsn_ericsson_kpi_daily", "NDM AL", "Freshness", "205", "45,300", "0.5%", "Low", "2026-09-09 07:00", "Ivan Nurcahyo"],
            ["twicloud.ipdk_ichm_combe_hist", "NDM SL", "Uniqueness", "96", "98,760", "0.1%", "Low", "2026-09-09 06:16", "Dewi Kartika"],
            ["base.oss_core_vas_data_msc_hh", "NDM AL", "Format Data", "58", "88,410", "0.1%", "Low", "2026-09-09 06:31", "Nabila Putri"],
            ["smy.etl_core_cs_nokia_gcs_dd_arch", "NDM SL", "Schema Drift", "9", "51,020", "0.02%", "Low", "2026-09-09 04:59", "Siti Nurhaliza"],
          ],
        },
        followUp:
          "The two Critical rows are both driven by the same upstream CDC lag issue we've seen before on default.icdm_icbw_cr — want me to pull up that incident history?",
      },
    ],
  },
]

const FALLBACK_REPLIES = [
  "I don't have a live model connected yet, so this is a placeholder reply — but here's roughly how a real answer would be formatted once INDY Assistant is wired up.",
  "Thanks for the question! This is a mock response so you can see the chat layout in action — a real answer will replace this once the assistant is connected to live data.",
  "Noted. I'm running in demo mode right now, so I can't reason over live NDQ data yet — but the conversation flow you're seeing here is exactly how it'll work end to end.",
]

let fallbackIndex = 0

export function getMockAssistantReply() {
  const reply = FALLBACK_REPLIES[fallbackIndex % FALLBACK_REPLIES.length]
  fallbackIndex += 1
  return reply
}

export function formatResponseTime(ms) {
  if (!ms && ms !== 0) return null
  return `Responded in ${(ms / 1000).toFixed(1)}s`
}

export function titleFromMessage(text) {
  const trimmed = text.trim()
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed
}
