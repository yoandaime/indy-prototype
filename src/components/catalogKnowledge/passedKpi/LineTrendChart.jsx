import { useMemo } from "react"
import ReactECharts from "echarts-for-react"
import { getThemeColors, TAILWIND_SHADES } from "@/lib/chartColors"

export default function LineTrendChart({ categories, values }) {
  const option = useMemo(() => {
    const { mutedForeground, border } = getThemeColors()
    const lineColor = TAILWIND_SHADES.blue[0]

    return {
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: categories,
        boundaryGap: false,
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: { color: mutedForeground, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: border } },
        axisLabel: { color: mutedForeground, fontSize: 11 },
      },
      series: [
        {
          type: "line",
          data: values,
          smooth: true,
          symbol: "none",
          lineStyle: { color: lineColor, width: 2 },
          itemStyle: { color: lineColor },
        },
      ],
    }
  }, [categories, values])

  return <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge />
}
