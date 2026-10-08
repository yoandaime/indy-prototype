import { useState } from "react"
import { ChevronLeft, ChevronRight, ChevronDown, Info, AlertTriangle } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import TrendAreaChart from "@/components/applications/TrendAreaChart"
import {
  GRANULARITIES,
  LAYERS,
  DIMENSIONS,
  APPLICATION_ROWS,
  CATEGORY_ROWS,
  DATE_CHIPS,
  TREND_DATES,
  tierForScore,
  getTrendSeries,
} from "@/data/applicationsDashboardData"

function InfoHint({ children }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Info className="size-3.5 text-neutral-400" />
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  )
}

function ScoreCell({ value, isLast = false }) {
  const { bg, text } = tierForScore(value)
  return (
    <TableCell className={`border-neutral-200 p-0 ${isLast ? "" : "border-r"}`}>
      <div className={`px-4 py-2.5 text-sm font-medium ${bg} ${text}`}>{value.toFixed(2)}%</div>
    </TableCell>
  )
}

function DimensionSection({ title, tooltip, extra, rows, selected, onSelect, nameLabel }) {
  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-center gap-1.5">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {extra}
        <InfoHint>{tooltip}</InfoHint>
      </div>
      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <RadioGroup value={selected} onValueChange={onSelect}>
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                <TableHead className="w-10 border-r border-neutral-200">Data Display</TableHead>
                <TableHead className="border-r border-neutral-200">{nameLabel}</TableHead>
                <TableHead className="border-r border-neutral-200">Completeness</TableHead>
                <TableHead>Timeliness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key} className="border-neutral-200">
                  <TableCell className="border-r border-neutral-200">
                    <RadioGroupItem value={row.key} />
                  </TableCell>
                  <TableCell className="border-r border-neutral-200 font-medium">
                    {row.name}
                  </TableCell>
                  <ScoreCell value={row.completeness} />
                  <ScoreCell value={row.timeliness} isLast />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </RadioGroup>
      </div>
    </div>
  )
}

function TrendCard({ title, dimension, onDimensionChange, seedKey }) {
  const series = getTrendSeries(seedKey, dimension)

  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <Select value={dimension} onValueChange={onDimensionChange}>
          <SelectTrigger className="h-8 w-fit gap-2 border-primary bg-[#FEF6F7] text-foreground hover:bg-[#FEF6F7] hover:text-foreground [&_svg]:text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIMENSIONS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <TrendAreaChart data={series} labels={TREND_DATES} />
    </div>
  )
}

export default function MainDashboardView() {
  const [viewMode, setViewMode] = useState("multiple")
  const [granularity, setGranularity] = useState("Daily")
  const [layer, setLayer] = useState("All Layer")
  const [activeDate, setActiveDate] = useState(DATE_CHIPS[1])
  const [selectedApp, setSelectedApp] = useState(APPLICATION_ROWS[0].key)
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_ROWS[0].key)
  const [appDimension, setAppDimension] = useState("Completeness")
  const [categoryDimension, setCategoryDimension] = useState("Completeness")

  const selectedAppRow = APPLICATION_ROWS.find((a) => a.key === selectedApp)
  const selectedCategoryRow = CATEGORY_ROWS.find((c) => c.key === selectedCategory)
  const activeDateIndex = DATE_CHIPS.indexOf(activeDate)

  const goToPreviousDate = () =>
    setActiveDate(DATE_CHIPS[Math.max(0, activeDateIndex - 1)])
  const goToNextDate = () =>
    setActiveDate(DATE_CHIPS[Math.min(DATE_CHIPS.length - 1, activeDateIndex + 1)])

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-neutral-50">
      <div className="flex items-start gap-3 border-b border-neutral-200 bg-amber-50 px-6 py-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          <span className="font-medium">Under development</span> — this page shows mock data and is still being built.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 border-b border-neutral-200 bg-white py-5">
        <p className="text-sm font-medium text-neutral-400">Dimensional View</p>
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList>
            <TabsTrigger value="single" className="w-[104px] flex-none">
              Single
            </TabsTrigger>
            <TabsTrigger value="multiple" className="w-[104px] flex-none">
              Multiple
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-6 py-3">
        <span className="flex items-center gap-1.5 text-sm text-neutral-500">
          <Info className="size-3.5" />
          Data Last Update: DD/MM/YYYY
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={granularity} onValueChange={setGranularity}>
            <SelectTrigger className="h-9 w-fit gap-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRANULARITIES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon-sm"
            disabled={activeDateIndex <= 0}
            onClick={goToPreviousDate}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {DATE_CHIPS.map((date) => (
            <Button
              key={date}
              variant="outline"
              size="sm"
              className={
                date === activeDate
                  ? "border-primary bg-[#FEF6F7] text-foreground hover:bg-[#FEF6F7] hover:text-foreground"
                  : "text-foreground"
              }
              onClick={() => setActiveDate(date)}
            >
              {date}
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon-sm"
            disabled={activeDateIndex >= DATE_CHIPS.length - 1}
            onClick={goToNextDate}
          >
            <ChevronRight className="size-4" />
          </Button>

          <Button variant="outline" size="sm" className="gap-1.5 text-foreground">
            09-06-2025
            <ChevronDown className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col bg-white">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-stretch">
          <DimensionSection
            title="Application"
            tooltip="Data quality scores per application."
            rows={APPLICATION_ROWS}
            selected={selectedApp}
            onSelect={setSelectedApp}
            nameLabel="Apps"
          />
          <TrendCard
            title={`Trend / ${selectedAppRow?.name ?? ""}`}
            dimension={appDimension}
            onDimensionChange={setAppDimension}
            seedKey={selectedApp}
          />
        </div>

        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-stretch">
          <DimensionSection
            title="Category Data"
            tooltip="Data quality scores per category, within the selected layer."
            rows={CATEGORY_ROWS}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            nameLabel="Category"
            extra={
              <>
                <span className="text-neutral-300">/</span>
                <Select value={layer} onValueChange={setLayer}>
                  <SelectTrigger className="h-7 w-fit gap-1 border-0 p-0 text-sm font-medium text-neutral-500 shadow-none hover:text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYERS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
          <TrendCard
            title={`Trend / ${selectedAppRow?.name ?? ""} / ${selectedCategoryRow?.name ?? ""}`}
            dimension={categoryDimension}
            onDimensionChange={setCategoryDimension}
            seedKey={`${selectedApp}-${selectedCategory}`}
          />
        </div>
      </div>
    </div>
  )
}
