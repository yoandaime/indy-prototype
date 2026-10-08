import { useMemo } from "react"
import { useOutletContext } from "react-router-dom"
import { Ticket, Clock, Archive, ShieldCheck, ShieldAlert, Gauge, AlertTriangle } from "lucide-react"
import AdminStatCard from "@/components/ticketing/AdminStatCard"
import IndyAssistantAlert from "@/components/ticketing/IndyAssistantAlert"
import { Card, CardContent } from "@/components/ui/card"
import { STATUS, getSlaInfo } from "@/data/ticketingData"
import { cn } from "@/lib/utils"

const STATUS_COLUMNS = [
  { status: STATUS.open, label: "Open", dotClass: "bg-sky-500" },
  { status: STATUS.inProgress, label: "In Progress", dotClass: "bg-amber-500" },
  { status: STATUS.pending, label: "Pending", dotClass: "bg-gray-400" },
  { status: STATUS.solved, label: "Solved", dotClass: "bg-emerald-500" },
  { status: STATUS.closed, label: "Close", dotClass: "bg-neutral-500" },
]

const TREND_DAYS = 14

// Derives the "System Overview" stats straight from the live tickets array
// (shared via TicketingLayout's outlet context) so every new/updated/closed
// ticket is reflected here immediately instead of a frozen dummy snapshot.
function useDashboardStats(tickets) {
  return useMemo(() => {
    const totalTickets = tickets.length
    const openInProgress = tickets.filter(
      (t) => t.status === STATUS.open || t.status === STATUS.inProgress || t.status === STATUS.pending
    ).length
    const closedArchive = tickets.filter((t) => t.status === STATUS.closed).length

    const decided = tickets.filter((t) => t.status === STATUS.solved || t.status === STATUS.closed)
    const slaMet = decided.filter((t) => getSlaInfo(t).state === "met").length
    const slaBreach = decided.filter((t) => getSlaInfo(t).state === "missed").length
    const compliance = decided.length > 0 ? Math.round((slaMet / decided.length) * 100) : 0

    const statusCounts = STATUS_COLUMNS.map((col) => ({
      ...col,
      value: tickets.filter((t) => t.status === col.status).length,
    }))

    const breachedTickets = decided.filter((t) => getSlaInfo(t).state === "missed")
    const breachDomainCounts = breachedTickets.reduce((acc, t) => {
      if (!t.domain) return acc
      acc[t.domain] = (acc[t.domain] ?? 0) + 1
      return acc
    }, {})
    const topBreachDomain = Object.entries(breachDomainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const trend = Array.from({ length: TREND_DAYS }, (_, i) => {
      const day = new Date(today)
      day.setDate(day.getDate() - (TREND_DAYS - 1 - i))
      const next = new Date(day)
      next.setDate(next.getDate() + 1)
      const dayTickets = tickets.filter((t) => {
        const created = new Date(t.createdAt)
        return created >= day && created < next
      })
      return {
        date: day.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
        open: dayTickets.filter((t) => t.status === STATUS.open || t.status === STATUS.pending).length,
        inProgress: dayTickets.filter((t) => t.status === STATUS.inProgress).length,
        close: dayTickets.filter((t) => t.status === STATUS.closed || t.status === STATUS.solved).length,
      }
    })

    return {
      totalTickets,
      openInProgress,
      closedArchive,
      slaMet,
      slaBreach,
      compliance,
      statusCounts,
      trend,
      topBreachDomain,
    }
  }, [tickets])
}

function StatusCountCard({ label, value, dotClass }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className={cn("size-2 rounded-full", dotClass)} />
          {label}
        </span>
        <span className="text-xl font-semibold text-foreground">{value}</span>
      </CardContent>
    </Card>
  )
}

function TrendBarColumn({ day, trendMax }) {
  return (
    <div className="flex h-full flex-1 flex-col justify-end">
      <div className="flex flex-col-reverse">
        {day.close > 0 && (
          <div
            className="w-full rounded-t-sm bg-neutral-500"
            style={{ height: `${(day.close / trendMax) * 160}px` }}
          />
        )}
        {day.inProgress > 0 && (
          <div
            className="w-full bg-amber-500"
            style={{ height: `${(day.inProgress / trendMax) * 160}px` }}
          />
        )}
        {day.open > 0 && (
          <div
            className="w-full rounded-t-sm bg-sky-500"
            style={{ height: `${(day.open / trendMax) * 160}px` }}
          />
        )}
      </div>
    </div>
  )
}

export default function DashboardSection() {
  const { tickets } = useOutletContext()
  const stats = useDashboardStats(tickets)
  const trendMax = Math.max(...stats.trend.map((d) => d.open + d.inProgress + d.close), 1)

  return (
    <div className="w-full flex-1 space-y-4.5 bg-white p-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">System Overview</h1>
        <p className="text-sm text-muted-foreground">
          Data quality performance, KPI table completeness & SLA compliance monitoring.{" "}
          <span className="font-medium text-foreground">SLA Compliance: {stats.compliance}%</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard icon={Ticket} label="Total Tickets" value={stats.totalTickets} iconClassName="text-sky-700" />
        <AdminStatCard
          icon={Clock}
          label="Open & In Progress"
          value={stats.openInProgress}
          iconClassName="text-amber-700"
          valueClassName="text-amber-700"
        />
        <AdminStatCard
          icon={Archive}
          label="Closed (Archive)"
          value={stats.closedArchive}
          iconClassName="text-purple-700"
          valueClassName="text-purple-700"
        />
        <AdminStatCard
          icon={ShieldCheck}
          label="SLA Met"
          value={stats.slaMet}
          iconClassName="text-emerald-700"
          valueClassName="text-emerald-700"
        />
        <AdminStatCard
          icon={ShieldAlert}
          label="SLA Breach"
          value={stats.slaBreach}
          iconClassName="text-red-700"
          valueClassName="text-red-700"
        />
        <AdminStatCard
          icon={Gauge}
          label="Compliance"
          value={`${stats.compliance}%`}
          iconClassName="text-amber-700"
          valueClassName="text-amber-700"
        />
      </div>

      <div className="space-y-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tickets by status</h2>
          <p className="text-xs text-muted-foreground">Every ticket, grouped by where it currently sits.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.statusCounts.map((s) => (
            <StatusCountCard key={s.label} {...s} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Ticket trend by status</h2>
          <p className="text-xs text-muted-foreground">
            {stats.totalTickets} tickets across the last 14 days.
          </p>
        </div>
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-neutral-500" />
                Close
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                In Progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-sky-500" />
                Open
              </span>
            </div>
            <div className="flex h-40 items-end gap-2">
              {stats.trend.map((day, i) => (
                <TrendBarColumn key={`${day.date}-${i}`} day={day} trendMax={trendMax} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {stats.trend.filter((_, i) => i % 2 === 0).map((day, i) => (
                <span key={`${day.date}-${i}`}>{day.date}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
        <div>
          <p className="text-sm font-medium text-red-800">
            {stats.slaBreach} tickets have breached SLA
          </p>
          <p className="text-sm text-red-700">
            {stats.compliance}% of tickets with a stopped clock met their target.
          </p>
        </div>
      </div>

      <IndyAssistantAlert>
        <p>
          Dalam periode ini, tercatat total <strong>{stats.totalTickets} tiket</strong>, dengan{" "}
          <strong>{stats.openInProgress} tiket</strong> masih open atau in progress dan{" "}
          <strong>{stats.closedArchive} tiket</strong> sudah closed/archived. Dari jumlah tersebut,{" "}
          <strong>{stats.slaMet} tiket</strong> memenuhi SLA sementara{" "}
          <strong>{stats.slaBreach} tiket</strong> melanggar SLA, menghasilkan compliance rate{" "}
          <strong>{stats.compliance}%</strong> — masih di bawah target 85%.
        </p>
        <p>
          {stats.slaBreach > 0 ? (
            <>
              Tingkat SLA breach saat ini menunjukkan proses penyelesaian masih lebih lambat dari
              target waktu.{" "}
              {stats.topBreachDomain ? (
                <>
                  Disarankan memprioritaskan review pada tiket-tiket dengan domain{" "}
                  <strong>{stats.topBreachDomain}</strong>, yang paling sering berkontribusi
                  terhadap breach.
                </>
              ) : (
                "Disarankan memprioritaskan review pada tiket yang sudah melewati target SLA."
              )}
            </>
          ) : (
            "Belum ada tiket yang melanggar SLA pada periode ini — pertahankan kecepatan respons saat ini."
          )}
        </p>
      </IndyAssistantAlert>
    </div>
  )
}
