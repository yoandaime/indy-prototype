import { useMemo } from "react"
import ReactECharts from "echarts-for-react"
import { TAILWIND_SHADES } from "@/lib/chartColors"

export default function ScoreDonutChart({ score }) {
  const option = useMemo(() => {
    const filled = TAILWIND_SHADES.blue[1]
    const track = TAILWIND_SHADES.blue[4]

    return {
      series: [
        {
          type: "pie",
          radius: ["78%", "96%"],
          startAngle: 90,
          silent: true,
          label: { show: false },
          labelLine: { show: false },
          data: [
            { value: score, itemStyle: { color: filled } },
            { value: 100 - score, itemStyle: { color: track } },
          ],
        },
      ],
    }
  }, [score])

  return (
    <div className="relative mx-auto size-[150px]">
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge />
      <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-foreground">
        {score}%
      </div>
    </div>
  )
}
