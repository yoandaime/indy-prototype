// Mock data for the PIC Category admin page — no backend integration yet.

export const LEVEL_META = [
  { key: "l0", label: "L0", description: "First line — triage and acknowledge." },
  { key: "l1", label: "L1", description: "Second line — investigate and fix." },
  { key: "l2", label: "L2", description: "Escalation — deep or vendor-side issues." },
]

export const ALL_PEOPLE = [
  "Admin Test",
  "Muhammad Isa Goutama",
  "Muhammad Adrian",
  "Bramantyo Adi",
  "Siti Nurhaliza",
  "Rahadian A.",
  "Dewi Kartika",
  "Nabila Putri",
  "Ivan Nurcahyo",
  "Fengky Pratama",
  "Yoga Pratama",
]

export const DEFAULT_CATEGORIES = [
  { name: "Other", l0: ["Admin Test", "Muhammad Isa Goutama", "Muhammad Adrian"], l1: [], l2: [] },
  { name: "RAN", l0: ["Bramantyo Adi", "Siti Nurhaliza"], l1: [], l2: [] },
  { name: "CORE PS", l0: ["Rahadian A.", "Dewi Kartika"], l1: ["Ivan Nurcahyo"], l2: [] },
  { name: "CORE CS", l0: ["Nabila Putri"], l1: ["Fengky Pratama"], l2: [] },
  { name: "TRANSPORT RAN", l0: ["Yoga Pratama"], l1: [], l2: [] },
  { name: "FMC", l0: ["Bramantyo Adi"], l1: [], l2: [] },
  { name: "IPDM", l0: ["Siti Nurhaliza"], l1: [], l2: [] },
  { name: "AVP", l0: ["Rahadian A."], l1: [], l2: [] },
  { name: "SNMP", l0: ["Dewi Kartika"], l1: [], l2: [] },
  { name: "RANSYS", l0: ["Ivan Nurcahyo"], l1: [], l2: [] },
  { name: "REVENUE", l0: ["Nabila Putri"], l1: [], l2: [] },
  { name: "TUTELA", l0: ["Fengky Pratama"], l1: [], l2: [] },
  { name: "COVMO", l0: ["Yoga Pratama"], l1: [], l2: [] },
  { name: "PERFORMANCE MANAGEMENT", l0: ["Admin Test"], l1: [], l2: [] },
  { name: "CEI+", l0: ["Bramantyo Adi"], l1: [], l2: [] },
  { name: "TWAMP", l0: ["Siti Nurhaliza"], l1: [], l2: [] },
  { name: "VOLTE", l0: ["Rahadian A."], l1: [], l2: [] },
  { name: "DSP", l0: [], l1: [], l2: [] },
  { name: "CAPACITY", l0: [], l1: [], l2: [] },
  { name: "REFERENCE", l0: [], l1: [], l2: [] },
  { name: "ICAM", l0: [], l1: [], l2: [] },
  { name: "TICKETING", l0: [], l1: [], l2: [] },
  { name: "RAN MASTER SITE", l0: [], l1: [], l2: [] },
  { name: "BCP", l0: [], l1: [], l2: [] },
  { name: "AMESTY", l0: [], l1: [], l2: [] },
  { name: "CORE VAS", l0: [], l1: [], l2: [] },
  { name: "AREA 1", l0: [], l1: [], l2: [] },
  { name: "OPEN SIGNAL", l0: [], l1: [], l2: [] },
  { name: "AREA 4", l0: [], l1: [], l2: [] },
].map((c, id) => ({ id: String(id), ...c }))
