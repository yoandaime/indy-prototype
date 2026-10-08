import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

const chartConfig = {
  rows: {
    label: "Rows",
    color: "var(--color-blue-500)",
  },
  uniq: {
    label: "Uniq",
    color: "var(--color-violet-500)",
  },
}

export default function ProfileTrendChart({ daily }) {
  const chartData = [...daily].reverse().map((d) => ({ date: d.date, rows: d.rows, uniq: d.uniq }))

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
      <LineChart data={chartData} margin={{ left: 12, right: 12, top: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={44} fontSize={11} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend verticalAlign="top" content={<ChartLegendContent verticalAlign="top" />} />
        <Line
          dataKey="rows"
          type="monotone"
          stroke="var(--color-rows)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-rows)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
        <Line
          dataKey="uniq"
          type="monotone"
          stroke="var(--color-uniq)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-uniq)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
