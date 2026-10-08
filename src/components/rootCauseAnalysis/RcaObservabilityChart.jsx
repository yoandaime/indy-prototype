import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
  warning: {
    label: "Warning",
    color: "var(--color-amber-500)",
  },
  issue: {
    label: "Issue",
    color: "var(--color-red-500)",
  },
};

export default function RcaObservabilityChart({ data }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[200px] w-full"
    >
      <AreaChart data={data} margin={{ left: 12, right: 12, top: 12 }}>
        <defs>
          <linearGradient id="rca-issue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-issue)"
              stopOpacity={0.35}
            />
            <stop offset="95%" stopColor="var(--color-issue)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={28}
          fontSize={11}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <ChartLegend
          verticalAlign="top"
          content={<ChartLegendContent verticalAlign="top" />}
        />
        <Area
          dataKey="warning"
          type="monotone"
          fill="transparent"
          stroke="var(--color-warning)"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "var(--color-warning)", strokeWidth: 0 }}
        />
        <Area
          dataKey="issue"
          type="monotone"
          fill="url(#rca-issue-fill)"
          stroke="var(--color-issue)"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "var(--color-issue)", strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
