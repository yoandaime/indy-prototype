import { useMemo } from "react"
import ReactECharts from "echarts-for-react"

const PASS_COLOR = "#22c55e"
const FAIL_COLOR = "#ef4444"
const BAR_HEIGHT = 10
const BAR_WIDTH = 120

export default function QualityStackedBar({ passPercent }) {
  const option = useMemo(() => {
    const pass = Math.max(0, Math.min(100, passPercent))
    const fail = 100 - pass

    return {
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { type: "value", max: 100, show: false },
      yAxis: { type: "category", data: [""], show: false },
      series: [
        {
          type: "bar",
          stack: "quality",
          data: [pass],
          barWidth: BAR_HEIGHT,
          itemStyle: { color: PASS_COLOR, borderRadius: [4, 0, 0, 4] },
          silent: true,
        },
        {
          type: "bar",
          stack: "quality",
          data: [fail],
          barWidth: BAR_HEIGHT,
          itemStyle: { color: FAIL_COLOR, borderRadius: [0, 4, 4, 0] },
          silent: true,
        },
      ],
    }
  }, [passPercent])

  return (
    <ReactECharts
      option={option}
      style={{ height: BAR_HEIGHT, width: BAR_WIDTH }}
      opts={{ renderer: "svg" }}
      notMerge
    />
  )
}
