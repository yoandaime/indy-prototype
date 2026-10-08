import { useEffect, useState } from "react"
import {
  CheckCircle2,
  Fingerprint,
  ShieldCheck,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  TriangleAlert,
  Database,
  Table2,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import ProfileTrendChart from "@/components/dataObservability/ProfileTrendChart"

const SEVERITY_STYLES = {
  CLEAN: "bg-emerald-100 text-emerald-700",
  WATCH: "bg-amber-100 text-amber-700",
  CRITICAL: "bg-red-100 text-red-700",
  ALWAYS_NULL: "bg-rose-200 text-rose-900",
}

const DIMENSION_META = {
  completeness: { label: "Completeness", icon: CheckCircle2, unit: "COUNT_ROW" },
  uniqueness: { label: "Uniqueness", icon: Fingerprint, unit: "UNIQUENESS_KEY" },
  validity: { label: "Validity", icon: ShieldCheck, unit: "VALIDITY_COLUMN" },
  timeliness: { label: "Timeliness", icon: Clock, unit: "TIMELINESS" },
}

function SeverityBadge({ severity }) {
  return (
    <Badge variant="outline" className={cn("border-transparent font-semibold", SEVERITY_STYLES[severity])}>
      {severity}
    </Badge>
  )
}

function GapBadge({ isGap }) {
  return isGap ? (
    <Badge variant="outline" className="border-transparent bg-red-100 font-semibold text-red-700">
      Gap
    </Badge>
  ) : (
    <Badge variant="outline" className="border-transparent bg-emerald-100 font-semibold text-emerald-700">
      OK
    </Badge>
  )
}

function GroupSection({ title, icon: Icon, children }) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-primary/10 text-primary">
          <Icon className="size-3" />
        </span>
        <p className="text-base font-semibold text-foreground">{title}</p>
      </div>
      <div className="flex w-full flex-col gap-4">{children}</div>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-xs font-medium text-foreground" title={String(value)}>
        {value}
      </p>
    </div>
  )
}

function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
        <Minus className="size-3" />
        0%
      </span>
    )
  }
  const isUp = delta > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isUp ? "text-emerald-600" : "text-red-600"
      )}
    >
      {isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(delta)}%
    </span>
  )
}

function DimensionCard({ dimensionKey, value, delta }) {
  const meta = DIMENSION_META[dimensionKey]
  const Icon = meta.icon
  const hasValue = value !== null && value !== undefined
  const tier = !hasValue ? "unknown" : value >= 95 ? "good" : value >= 80 ? "watch" : "critical"

  return (
    <div
      className={cn(
        "flex-1 rounded-lg border bg-white p-4 shadow-sm",
        tier === "critical" ? "border-red-200 ring-1 ring-red-100" : "border-neutral-200"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-4", tier === "critical" ? "text-red-600" : "text-muted-foreground")} />
          <p className="text-xs font-medium text-muted-foreground">{meta.label}</p>
        </div>
        {tier === "critical" && <TriangleAlert className="size-4 text-red-500" />}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-foreground">{hasValue ? `${value}%` : "—"}</p>
        <DeltaBadge delta={delta} />
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn(
            "h-full rounded-full",
            tier === "good" && "bg-emerald-500",
            tier === "watch" && "bg-amber-500",
            tier === "critical" && "bg-red-500",
            tier === "unknown" && "bg-neutral-300"
          )}
          style={{ width: hasValue ? `${Math.min(100, Math.max(0, value))}%` : "0%" }}
        />
      </div>
      <p className="mt-2 text-[10px] tracking-wide text-muted-foreground uppercase">{meta.unit}</p>
    </div>
  )
}

function LoadingBar() {
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="w-full shrink-0 py-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-[800ms] ease-linear"
          style={{ width: filled ? "100%" : "0%" }}
        />
      </div>
    </div>
  )
}

function ProfilingSkeleton() {
  return (
    <>
      <LoadingBar />

      <GroupSection title="Metadata" icon={Database}>
        <div className="grid w-full shrink-0 grid-cols-4 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm [&>*]:border-r [&>*]:border-b [&>*]:border-neutral-200 [&>*:nth-child(4n)]:border-r-0 [&>*:nth-last-child(-n+4)]:border-b-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1.5 px-3 py-2.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ))}
        </div>
      </GroupSection>

      <GroupSection title="Variable" icon={Table2}>
        <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>

        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </GroupSection>

      <GroupSection title="Trend" icon={TrendingUp}>
        <Skeleton className="h-[220px] w-full" />
      </GroupSection>
    </>
  )
}

export default function ProfilingResults({ profile, isLoading }) {
  if (isLoading) {
    return <ProfilingSkeleton />
  }

  if (!profile) {
    return (
      <div className="flex h-[450px] w-full items-center justify-center rounded-lg border border-dashed border-neutral-200 text-sm text-muted-foreground">
        Configure the profile on the left, then click Profile Table.
      </div>
    )
  }

  const sampleColumns = profile.sample.length ? Object.keys(profile.sample[0]) : []

  return (
    <div className="flex w-full flex-col gap-4">
      <GroupSection title="Metadata" icon={Database}>
        <div className="grid w-full shrink-0 grid-cols-4 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm [&>*]:border-r [&>*]:border-b [&>*]:border-neutral-200 [&>*:nth-child(4n)]:border-r-0 [&>*:nth-last-child(-n+4)]:border-b-0">
          <InfoItem label="Table" value={profile.table} />
          <InfoItem
            label="Period / Insert"
            value={`${profile.period}${profile.insertTimeColumn ? ` / ${profile.insertTimeColumn}` : ""}`}
          />
          <InfoItem label="Uniq Key" value={profile.uniqKeyColumns.length ? profile.uniqKeyColumns.join(", ") : "—"} />
          <InfoItem label="Last Insert Query" value={profile.lastInsertQuery} />
          <InfoItem label="Avg Rows" value={profile.summary.avg_rows} />
          <InfoItem label="Days w/ Data" value={`${profile.summary.days_with_data} / ${profile.summary.days_total}`} />
          <InfoItem label="Days w/ Gap" value={profile.summary.gap_days} />
          <InfoItem label="Days w/ Null" value={profile.summary.null_days} />
        </div>
      </GroupSection>

      <GroupSection title="Variable" icon={Table2}>
        <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
          {profile.dimensions.map((d) => (
            <DimensionCard key={d.key} dimensionKey={d.key} value={d.value} delta={d.delta} />
          ))}
        </div>

        <div className="flex w-full flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Daily Table</p>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>First Insert</TableHead>
                  <TableHead>Last Insert</TableHead>
                  <TableHead>Row Count</TableHead>
                  <TableHead>Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.daily.map((d) => (
                  <TableRow key={d.date}>
                    <TableCell>{d.date}</TableCell>
                    <TableCell>{d.first_insert}</TableCell>
                    <TableCell>{d.last_insert}</TableCell>
                    <TableCell>{d.rows}</TableCell>
                    <TableCell>
                      <GapBadge isGap={d.is_gap} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {profile.keyCheckColumns.length > 0 && (
          <div className="flex w-full flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Key Column Check</p>
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {profile.keyCheckColumns.map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.keyUniqCompare.map((entry) => (
                    <TableRow key={entry.date}>
                      <TableCell>{entry.date}</TableCell>
                      {profile.keyCheckColumns.map((col) => (
                        <TableCell key={col}>
                          {entry[col] === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="flex items-center gap-2">
                              {entry[col].uniq}
                              <Badge
                                variant="outline"
                                className={cn(
                                  "border-transparent font-semibold",
                                  entry[col].isConsistent ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                )}
                              >
                                {entry[col].isConsistent ? "consistent" : "changed"}
                              </Badge>
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Sample Data</p>
          <div className="max-h-[320px] overflow-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  {sampleColumns.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.sample.map((row, i) => (
                  <TableRow key={i}>
                    {sampleColumns.map((col) => (
                      <TableCell key={col} className="whitespace-nowrap">
                        {row[col] === null || row[col] === undefined || row[col] === "" ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          String(row[col])
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Column null/empty profile ({profile.consistentNull.length} columns)</p>
          <div className="max-h-[360px] overflow-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Column Type</TableHead>
                  <TableHead>Avg Null %</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Days Null</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.consistentNull.map((c) => (
                  <TableRow key={c.column}>
                    <TableCell>{c.column}</TableCell>
                    <TableCell className="text-muted-foreground">{c.column_type}</TableCell>
                    <TableCell>{c.avg_null_pct}%</TableCell>
                    <TableCell>
                      <SeverityBadge severity={c.severity} />
                    </TableCell>
                    <TableCell>
                      {c.days_null} / {c.days_total}
                    </TableCell>
                    <TableCell>{c.min_value === null ? <span className="text-muted-foreground">—</span> : c.min_value}</TableCell>
                    <TableCell>{c.max_value === null ? <span className="text-muted-foreground">—</span> : c.max_value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </GroupSection>

      <GroupSection title="Trend" icon={TrendingUp}>
        <ProfileTrendChart daily={profile.daily} />
      </GroupSection>
    </div>
  )
}
