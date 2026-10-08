import { useMemo, useState } from "react"
import { Download, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import DimensionBarChart from "@/components/subscription/DimensionBarChart"
import SummaryCard from "@/components/catalogKnowledge/passedKpi/SummaryCard"
import ScoreDonutChart from "@/components/catalogKnowledge/passedKpi/ScoreDonutChart"
import LineTrendChart from "@/components/catalogKnowledge/passedKpi/LineTrendChart"
import ReportCategoryPicker from "@/components/catalogKnowledge/passedKpi/ReportCategoryPicker"
import PassedKpiInsightChart from "@/components/catalogKnowledge/passedKpi/PassedKpiInsightChart"
import DeltaBadge from "@/components/catalogKnowledge/passedKpi/DeltaBadge"
import {
  PASSED_KPI_CATEGORIES,
  PASSED_KPI_SUMMARY,
  PASSED_KPI_TOP_TABLES,
  PASSED_KPI_TREND,
  TABLE_INSIGHT_COLUMNS,
  getTableInsight,
} from "@/data/passedKpiData"
import { cn } from "@/lib/utils"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function downloadCsv(tableId, insight) {
  const header = ["Date", ...TABLE_INSIGHT_COLUMNS, "Average", "Pass KPI", "Not Pass KPI"]
  const lines = insight.rows.map((row) =>
    [row.date, ...row.values, row.average, row.passKpi, row.notPassKpi].join(",")
  )
  const csv = [header.join(","), ...lines].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${tableId}-passed-kpi.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function PassedKpiSection() {
  const [selectedTableId, setSelectedTableId] = useState("ran_cell_daily_5g")
  const [selectedMonth, setSelectedMonth] = useState("May")
  const [metric, setMetric] = useState("completeness")

  const selectedTable = useMemo(() => {
    for (const category of PASSED_KPI_CATEGORIES) {
      const table = category.tables.find((t) => t.id === selectedTableId)
      if (table) return table
    }
    return null
  }, [selectedTableId])

  const insight = useMemo(() => getTableInsight(selectedTableId), [selectedTableId])

  const chartTitle = selectedTable
    ? `${selectedTable.name.replace(/_/g, " ")} Passed Daily KPI (>=${insight.threshold}%)`
    : ""

  return (
    <div className="h-full min-w-0 flex-1 space-y-6 overflow-y-auto bg-white px-10 pt-6 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl leading-6 font-semibold text-foreground">Summary</h2>
          <p className="text-xs leading-4 text-neutral-600">Weekly Completeness and Timeliness KPI performance.</p>
        </div>
        <p className="pt-1 text-xs text-muted-foreground">Display data from 1 week ago, start on: 9 September 2025</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <SummaryCard title="Completeness Score">
          <div className="flex flex-col items-center gap-2">
            <ScoreDonutChart score={PASSED_KPI_SUMMARY.completeness.score} />
            <DeltaBadge delta={PASSED_KPI_SUMMARY.completeness.wow} />
            <p className="text-[10px] text-muted-foreground">WoW</p>
          </div>
        </SummaryCard>

        <SummaryCard title="Top 5 Best Tables">
          <DimensionBarChart rows={PASSED_KPI_TOP_TABLES.completeness.best} color="#059669" labelPlacement="inside" />
        </SummaryCard>

        <SummaryCard title="Top 5 Worse Tables">
          <DimensionBarChart rows={PASSED_KPI_TOP_TABLES.completeness.worst} color="#ef4444" labelPlacement="inside" />
        </SummaryCard>

        <SummaryCard title="Completeness Trend">
          <div className="h-[180px]">
            <LineTrendChart categories={PASSED_KPI_TREND.dates} values={PASSED_KPI_TREND.completeness} />
          </div>
        </SummaryCard>

        <SummaryCard title="Timeliness Score">
          <div className="flex flex-col items-center gap-2">
            <ScoreDonutChart score={PASSED_KPI_SUMMARY.timeliness.score} />
            <DeltaBadge delta={PASSED_KPI_SUMMARY.timeliness.wow} />
            <p className="text-[10px] text-muted-foreground">WoW</p>
          </div>
        </SummaryCard>

        <SummaryCard title="Top 5 Best Tables">
          <DimensionBarChart rows={PASSED_KPI_TOP_TABLES.timeliness.best} color="#059669" labelPlacement="inside" />
        </SummaryCard>

        <SummaryCard title="Top 5 Worse Tables">
          <DimensionBarChart rows={PASSED_KPI_TOP_TABLES.timeliness.worst} color="#ef4444" labelPlacement="inside" />
        </SummaryCard>

        <SummaryCard title="Timeliness Trend">
          <div className="h-[180px]">
            <LineTrendChart categories={PASSED_KPI_TREND.dates} values={PASSED_KPI_TREND.timeliness} />
          </div>
        </SummaryCard>
      </div>

      <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Table Insight</p>

        <div className="flex flex-wrap items-center gap-2">
          <ReportCategoryPicker categories={PASSED_KPI_CATEGORIES} value={selectedTableId} onChange={setSelectedTableId} />

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-5 w-px bg-border" />

          <Button
            variant={metric === "completeness" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setMetric("completeness")}
          >
            Completeness
          </Button>
          <Button
            variant={metric === "timeliness" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setMetric("timeliness")}
          >
            Timeliness
          </Button>
        </div>

        <PassedKpiInsightChart
          title={chartTitle}
          metricLabel={metric === "completeness" ? "Completeness" : "Timeliness"}
          dates={insight.rows.map((r) => r.date)}
          passKpi={insight.rows.map((r) => r.passKpi)}
          notPassKpi={insight.rows.map((r) => r.notPassKpi)}
          average={insight.rows.map((r) => r.average)}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium text-foreground">Threshold: {insight.threshold.toFixed(2)}%</span>
            <Pencil className="size-3.5 text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadCsv(selectedTableId, insight)}>
            <Download className="size-3.5" />
            Download csv
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="whitespace-nowrap">Date</TableHead>
                {TABLE_INSIGHT_COLUMNS.map((col) => (
                  <TableHead key={col} className="font-mono whitespace-nowrap">
                    {col}
                  </TableHead>
                ))}
                <TableHead className="whitespace-nowrap">Average</TableHead>
                <TableHead className="whitespace-nowrap">Pass KPI</TableHead>
                <TableHead className="whitespace-nowrap">Not Pass KPI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-neutral-50 font-medium hover:bg-neutral-50">
                <TableCell>Above Target</TableCell>
                {TABLE_INSIGHT_COLUMNS.map((_, i) => (
                  <TableCell key={i}>-</TableCell>
                ))}
                <TableCell>{insight.aboveTarget}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
              <TableRow className="bg-neutral-50 font-medium hover:bg-neutral-50">
                <TableCell>Average</TableCell>
                {insight.totals.map((v, i) => (
                  <TableCell key={i}>{v}%</TableCell>
                ))}
                <TableCell>{insight.overallAverage}%</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
              </TableRow>

              {insight.rows.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="whitespace-nowrap">{row.date}</TableCell>
                  {row.values.map((v, i) => (
                    <TableCell key={i} className="whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        {v}%
                        <DeltaBadge delta={row.deltas[i]} />
                      </span>
                    </TableCell>
                  ))}
                  <TableCell>{row.average}%</TableCell>
                  <TableCell className={cn(row.passKpi > 1 && "font-semibold text-emerald-700")}>{row.passKpi}</TableCell>
                  <TableCell>{row.notPassKpi}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
