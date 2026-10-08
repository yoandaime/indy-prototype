import { useMemo } from "react"
import ReactECharts from "echarts-for-react"
import { getThemeColors, TAILWIND_SHADES } from "@/lib/chartColors"

const LABEL_WIDTH = 64

export default function LoginDurationChart({ buckets }) {
  const option = useMemo(() => {
    const { foreground, mutedForeground, border } = getThemeColors()
    const barColor = TAILWIND_SHADES.blue[2]
    const labels = buckets.map((b) => b.label)
    const counts = buckets.map((b) => b.count)
    const gridLeft = LABEL_WIDTH + 16

    return {
      grid: { left: gridLeft, right: 24, top: 8, bottom: 8, containLabel: false },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: border } },
        axisLabel: { color: mutedForeground, fontSize: 11 },
      },
      yAxis: {
        type: "category",
        data: labels,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: foreground,
          fontSize: 12,
          fontWeight: 500,
          align: "left",
          margin: gridLeft - 8,
          width: LABEL_WIDTH,
          overflow: "truncate",
        },
      },
      series: [
        {
          type: "bar",
          data: counts,
          barMaxWidth: 18,
          itemStyle: { color: barColor, borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: "right",
            color: mutedForeground,
            fontSize: 12,
          },
        },
      ],
    }
  }, [buckets])

  return <ReactECharts option={option} style={{ height: 300, width: "100%" }} notMerge />
}
