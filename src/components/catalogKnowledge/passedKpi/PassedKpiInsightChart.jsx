import { useMemo } from "react"
import ReactECharts from "echarts-for-react"
import { getThemeColors } from "@/lib/chartColors"

const PASS_COLOR = "#22c55e"
const NOT_PASS_COLOR = "#4c1d95"
const AVERAGE_COLOR = "#f97316"

export default function PassedKpiInsightChart({ title, metricLabel = "Completeness", dates, passKpi, notPassKpi, average }) {
  const option = useMemo(() => {
    const { mutedForeground, border } = getThemeColors()

    return {
      grid: { left: 40, right: 48, top: 56, bottom: 56, containLabel: true },
      tooltip: { trigger: "axis" },
      legend: {
        top: 24,
        left: 0,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 3,
        textStyle: { color: mutedForeground, fontSize: 12 },
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: { color: mutedForeground, fontSize: 10, rotate: 45 },
      },
      yAxis: [
        {
          type: "value",
          name: "Count of KPI",
          nameLocation: "middle",
          nameGap: 28,
          nameTextStyle: { color: mutedForeground, fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: border } },
          axisLabel: { color: mutedForeground, fontSize: 11 },
        },
        {
          type: "value",
          name: `${metricLabel} Average`,
          nameLocation: "middle",
          nameGap: 36,
          nameTextStyle: { color: mutedForeground, fontSize: 11 },
          min: 0,
          max: 100,
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { color: mutedForeground, fontSize: 11 },
        },
      ],
      series: [
        {
          name: "Pass KPI",
          type: "bar",
          stack: "kpi",
          data: passKpi,
          itemStyle: { color: PASS_COLOR },
          barMaxWidth: 14,
        },
        {
          name: "Not Pass KPI",
          type: "bar",
          stack: "kpi",
          data: notPassKpi,
          itemStyle: { color: NOT_PASS_COLOR },
          barMaxWidth: 14,
        },
        {
          name: `${metricLabel} Average`,
          type: "line",
          yAxisIndex: 1,
          data: average,
          smooth: false,
          symbol: "circle",
          symbolSize: 5,
          lineStyle: { color: AVERAGE_COLOR, width: 2 },
          itemStyle: { color: AVERAGE_COLOR },
        },
      ],
    }
  }, [dates, passKpi, notPassKpi, average, metricLabel])

  return (
    <div>
      {title && <p className="mb-2 text-center text-sm font-semibold text-foreground">{title}</p>}
      <ReactECharts option={option} style={{ height: 340, width: "100%" }} notMerge />
    </div>
  )
}
