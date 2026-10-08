import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { resolveColor } from "./resolveColor";

// Small donut + left-hand legend, used for "Issue by Severity" / "Issue by
// Layer" — mirrors ScoreDonutChart's echarts pie approach but with multiple
// named segments instead of a single score-vs-track split.
export default function RcaDonutLegend({ total, segments, caption }) {
  const resolved = useMemo(
    () => segments.map((s) => ({ ...s, color: resolveColor(s.color) })),
    [segments],
  );

  const option = useMemo(
    () => ({
      series: [
        {
          type: "pie",
          radius: ["65%", "92%"],
          startAngle: 90,
          silent: true,
          label: { show: false },
          labelLine: { show: false },
          data: resolved.length
            ? resolved.map((s) => ({
                value: s.value,
                itemStyle: { color: s.color },
              }))
            : [
                {
                  value: 1,
                  itemStyle: {
                    color: resolveColor("var(--color-neutral-200)"),
                  },
                },
              ],
        },
      ],
    }),
    [resolved],
  );

  return (
    <div className="flex w-full items-center gap-4">
      <div className="flex flex-1 flex-col gap-1.5">
        {resolved.map((s) => (
          <span
            key={s.label}
            className="flex items-center gap-1.5 text-xs text-foreground"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <div className="relative size-[108px]">
          <ReactECharts
            option={option}
            style={{ height: "100%", width: "100%" }}
            notMerge
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-semibold text-foreground">
              {total}
            </span>
          </div>
        </div>
        <span className="text-[10px] leading-tight text-muted-foreground">
          {caption}
        </span>
      </div>
    </div>
  );
}
