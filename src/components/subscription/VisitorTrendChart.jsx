import { useMemo } from "react"
import ReactECharts from "echarts-for-react"
import { getThemeColors, TAILWIND_SHADES } from "@/lib/chartColors"

export default function VisitorTrendChart({ hours, visitors }) {
  const option = useMemo(() => {
    const { mutedForeground, border } = getThemeColors()
    const lineColor = TAILWIND_SHADES.violet[2]

    return {
      grid: { left: 8, right: 16, top: 44, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis" },
      legend: {
        top: 0,
        left: 0,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 3,
        textStyle: { color: mutedForeground, fontSize: 12 },
      },
      xAxis: {
        type: "category",
        data: hours,
        boundaryGap: false,
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: { color: mutedForeground, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: border } },
        axisLabel: { color: mutedForeground, fontSize: 11 },
      },
      series: [
        {
          name: "Visitors",
          type: "line",
          data: visitors,
          smooth: false,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: lineColor, width: 2 },
          itemStyle: { color: lineColor },
        },
      ],
    }
  }, [hours, visitors])

  return <ReactECharts option={option} style={{ height: 300, width: "100%" }} notMerge />
}
