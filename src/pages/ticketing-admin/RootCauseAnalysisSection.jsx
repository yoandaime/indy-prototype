import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ArrowUpDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import RcaObservabilityChart from "@/components/rootCauseAnalysis/RcaObservabilityChart";
import RcaTrendBarChart from "@/components/rootCauseAnalysis/RcaTrendBarChart";
import RcaDonutLegend from "@/components/rootCauseAnalysis/RcaDonutLegend";
import RcaScoreCard from "@/components/rootCauseAnalysis/RcaScoreCard";
import RcaPerformanceCard from "@/components/rootCauseAnalysis/RcaPerformanceCard";
import TopWorstList from "@/components/rootCauseAnalysis/TopWorstList";
import {
  getDimensionKeys,
  getStandardRules,
} from "@/lib/dqComposer/ruleCatalog";
import {
  ALL_OPTION,
  RCA_CATEGORIES,
  RCA_MONTHS,
  RCA_VISIBLE_MONTHS,
  RCA_DEFAULT_MONTH,
  fetchRcaDashboardData,
} from "@/data/rootCauseAnalysisData";
import { notifySuccess } from "@/lib/toast";

// Biggest Issue tables always render this many rows (padded / capped).
const BIGGEST_ISSUE_ROWS = 5;

function ChartSkeleton({ className = "h-[200px]" }) {
  return <Skeleton className={`w-full ${className}`} />;
}

function ListSkeleton({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-5 w-full" />
      ))}
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="size-[108px] rounded-full" />
    </div>
  );
}

function SortableHead({ children, className }) {
  return (
    <TableHead className={className}>
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className="size-3 text-muted-foreground" />
      </span>
    </TableHead>
  );
}

export default function RootCauseAnalysisSection() {
  const [category, setCategory] = useState(RCA_CATEGORIES[0]);
  const [dimension, setDimension] = useState(ALL_OPTION);
  const [ruleTitle, setRuleTitle] = useState(ALL_OPTION);
  const [selectedMonth, setSelectedMonth] = useState(RCA_DEFAULT_MONTH);

  const dimensionOptions = useMemo(() => getDimensionKeys(), []);
  // Rule list narrows to the chosen dimension, like a dependent filter.
  const ruleOptions = useMemo(
    () =>
      getStandardRules()
        .filter((r) => dimension === ALL_OPTION || r.dimension === dimension)
        .map((r) => r.title),
    [dimension],
  );
  const [data, setData] = useState(null);
  const loading = data === null;

  useEffect(() => {
    let cancelled = false;
    setData(null);
    fetchRcaDashboardData({
      category,
      dimension,
      rule: ruleTitle,
      month: selectedMonth,
    }).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [category, dimension, ruleTitle, selectedMonth]);

  function handleDimensionChange(value) {
    setDimension(value);
    setRuleTitle(ALL_OPTION);
  }
  const overflowMonths = RCA_MONTHS.filter(
    (m) => !RCA_VISIBLE_MONTHS.includes(m),
  );

  const isOverflowSelected = overflowMonths.includes(selectedMonth);

  function handleSeeDetail(label) {
    notifySuccess(
      "Detail view",
      `"${label}" detail is not wired up in this prototype yet.`,
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-white">
      {
        <div className="flex flex-1 flex-col gap-6 px-6 py-6">
          <div className="flex flex-wrap items-center justify-start gap-2.5">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[104px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RCA_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dimension} onValueChange={handleDimensionChange}>
              <SelectTrigger className="w-[136px] bg-background">
                <SelectValue>
                  {dimension === ALL_OPTION ? "All Dimensions" : dimension}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION}>All Dimensions</SelectItem>
                {dimensionOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ruleTitle} onValueChange={setRuleTitle}>
              <SelectTrigger className="w-[130px] bg-background">
                <SelectValue>
                  {ruleTitle === ALL_OPTION ? "All Rules" : ruleTitle}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION}>All Rules</SelectItem>
                {ruleOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mx-1 h-6 w-px bg-neutral-200" />

            <div className="flex items-center gap-1.5">
              {RCA_VISIBLE_MONTHS.map((month) => (
                <Button
                  key={month}
                  type="button"
                  size="sm"
                  variant={selectedMonth === month ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setSelectedMonth(month)}
                >
                  {month}
                </Button>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      size="sm"
                      variant={isOverflowSelected ? "default" : "outline"}
                      className="rounded-full"
                    />
                  }
                >
                  {isOverflowSelected ? selectedMonth : "More"}
                  <ChevronDown className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {overflowMonths.map((month) => (
                    <DropdownMenuItem
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                    >
                      {month}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  Observability
                  <Tooltip>
                    <TooltipTrigger render={<span />}>
                      <AlertCircle className="size-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Warning vs. confirmed issue count over time
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {loading ? (
                  <ChartSkeleton />
                ) : (
                  <RcaObservabilityChart data={data.observability} />
                )}
                <div className="flex flex-col gap-4 border-t border-neutral-100 pt-4">
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">
                      Issue by Severity
                    </p>
                    {loading ? (
                      <DonutSkeleton />
                    ) : (
                      <RcaDonutLegend
                        total={data.issueBySeverity.total}
                        segments={data.issueBySeverity.segments}
                        caption="Total issue by severity"
                      />
                    )}
                  </div>
                  <div className="border-t border-neutral-100 pt-4">
                    <p className="mb-2 text-sm font-medium text-foreground">
                      Issue by Layer
                    </p>
                    {loading ? (
                      <DonutSkeleton />
                    ) : (
                      <RcaDonutLegend
                        total={data.issueByLayer.total}
                        segments={data.issueByLayer.segments}
                        caption="Total issue by layer"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm">Trend Table Issue</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {loading ? (
                  <>
                    <ChartSkeleton />
                    <ListSkeleton />
                  </>
                ) : (
                  <>
                    <RcaTrendBarChart
                      data={data.trendTable}
                      label="Table Issue"
                      color="blue"
                    />
                    <TopWorstList
                      title="Top Worst Table (Layer)"
                      period={data.periodLabel}
                      rows={data.topWorstTables}
                      barColorClass="bg-blue-500"
                      onSeeDetail={() => handleSeeDetail("Top Worst Table")}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm">
                  Trend Vendor Region Issue
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {loading ? (
                  <>
                    <ChartSkeleton />
                    <ListSkeleton />
                  </>
                ) : (
                  <>
                    <RcaTrendBarChart
                      data={data.trendVendorRegion}
                      label="Vendor Region Issue"
                      color="emerald"
                    />
                    <TopWorstList
                      title="Top Worst Vendor (Region)"
                      period={data.periodLabel}
                      rows={data.topWorstVendors}
                      barColorClass="bg-emerald-500"
                      onSeeDetail={() => handleSeeDetail("Top Worst Vendor")}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  Trend IP Source Issue
                  <Tooltip>
                    <TooltipTrigger render={<span />}>
                      <AlertCircle className="size-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Issues grouped by originating IP source
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {loading ? (
                  <>
                    <ChartSkeleton />
                    <ListSkeleton />
                  </>
                ) : (
                  <>
                    <RcaTrendBarChart
                      data={data.trendIpSource}
                      label="IP Source Issue"
                      color="rose"
                    />
                    <TopWorstList
                      title="Top Worst IP Source Issue"
                      period={data.periodLabel}
                      rows={data.topWorstIpSources}
                      barColorClass="bg-rose-500"
                      onSeeDetail={() =>
                        handleSeeDetail("Top Worst IP Source Issue")
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-base font-semibold text-foreground">
                Biggest Issue on Layer
              </h2>
              <span className="text-xs text-muted-foreground">
                Last Update: {new Date().toString()}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {(loading
                ? [
                    { layer: "NDM SPEED LAYER" },
                    { layer: "NDM ANALYTIC LAYER" },
                  ]
                : data.biggestIssueByLayer
              ).map((group) => (
                <div key={group.layer} className="flex flex-col gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AlertCircle className="size-4 text-red-500" />
                    {group.layer}
                  </p>
                  <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
                    <Table className="table-fixed">
                      <TableHeader>
                        <TableRow>
                          <SortableHead className="w-[40%]">
                            Worst Table
                          </SortableHead>
                          <SortableHead className="w-[28%]">Case</SortableHead>
                          <SortableHead className="w-[32%] text-center">
                            Total Issue/Month
                          </SortableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: BIGGEST_ISSUE_ROWS }, (_, i) => (
                            <TableRow key={i} className="h-12">
                              <TableCell colSpan={3}>
                                <Skeleton className="h-5 w-full" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : group.rows.length === 0 ? (
                          <TableRow style={{ height: BIGGEST_ISSUE_ROWS * 48 }}>
                            <TableCell
                              colSpan={3}
                              className="text-center text-muted-foreground"
                            >
                              No issues found
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {group.rows
                              .slice(0, BIGGEST_ISSUE_ROWS)
                              .map((row) => (
                                <TableRow key={row.table} className="h-12">
                                  <TableCell
                                    className="truncate"
                                    title={row.table}
                                  >
                                    {row.table}
                                  </TableCell>
                                  <TableCell className="truncate">
                                    {row.case}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {row.total}
                                  </TableCell>
                                </TableRow>
                              ))}
                            {/* Pad short lists with one plain spacer (no row border) so both tables keep the same height. */}
                            {group.rows.length < BIGGEST_ISSUE_ROWS && (
                              <TableRow
                                className="border-0 hover:bg-transparent"
                                style={{
                                  height:
                                    (BIGGEST_ISSUE_ROWS - group.rows.length) *
                                    48,
                                }}
                                aria-hidden
                              >
                                <TableCell colSpan={3} />
                              </TableRow>
                            )}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-3 lg:col-span-2">
              <h2 className="text-base font-semibold text-foreground">
                Layer Performance Review
              </h2>
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                {loading
                  ? [0, 1].map((i) => <RcaPerformanceCard key={i} loading />)
                  : data.layerPerformance.map((layer) => (
                      <RcaPerformanceCard
                        key={layer.layer}
                        title={layer.layer}
                        perf={layer}
                      />
                    ))}
              </div>
            </div>

            <RcaScoreCard metrics={data?.scoreCard} loading={loading} />
          </div>
        </div>
      }
    </div>
  );
}
