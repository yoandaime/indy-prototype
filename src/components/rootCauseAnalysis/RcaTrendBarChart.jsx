import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

export default function RcaTrendBarChart({ data, label, color }) {
  const chartConfig = {
    value: { label, color: `var(--color-${color}-500)` },
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[200px] w-full"
    >
      <BarChart data={data} margin={{ left: 12, right: 12, top: 12 }}>
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
        <Bar dataKey="value" fill="var(--color-value)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
