import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

const chartConfig = {
  rate: {
    label: "Rate",
    color: "var(--color-chart-3)",
  },
}

export default function TrendAreaChart({ data, labels }) {
  const chartData = labels.map((label, i) => ({ label, rate: data[i] }))

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
      <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 12 }}>
        <defs>
          <linearGradient id="trend-rate-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-rate)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={36}
          fontSize={11}
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend verticalAlign="top" content={<ChartLegendContent verticalAlign="top" />} />
        <Area
          dataKey="rate"
          type="monotone"
          fill="url(#trend-rate-fill)"
          stroke="var(--color-rate)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-rate)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
