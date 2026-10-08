import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { resolveColor } from "./resolveColor";

// Segmented band gauge: a ring split into equal blocks, colored by score band
// (red → amber → green → blue), with a needle pointing at the current score.
const SEGMENTS = 25;
const BANDS = [
  { until: 0.76, color: "var(--color-red-400)" },
  { until: 0.88, color: "var(--color-amber-400)" },
  { until: 0.96, color: "var(--color-lime-400)" },
  { until: 1, color: "var(--color-blue-400)" },
];

export default function RcaGauge({ score }) {
  const option = useMemo(
    () => ({
      series: [
        {
          type: "gauge",
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: SEGMENTS,
          radius: "100%",
          center: ["50%", "88%"],
          axisLine: {
            lineStyle: {
              width: 30,
              color: BANDS.map((b) => [b.until, resolveColor(b.color)]),
            },
          },
          // White separators carve the ring into blocks.
          splitLine: {
            show: true,
            length: 30,
            distance: -30,
            lineStyle: { color: "#fff", width: 3 },
          },
          axisTick: { show: false },
          axisLabel: { show: false },
          pointer: {
            show: true,
            // Slim tapered needle, tip at the score and base at the hub.
            icon: "path://M50,0 L100,100 L0,100 Z",
            length: "62%",
            width: 4,
            offsetCenter: [0, 0],
            itemStyle: { color: resolveColor("var(--color-neutral-600)") },
          },
          anchor: { show: false },
          detail: { show: false },
          animationDuration: 700,
          data: [{ value: score }],
        },
      ],
    }),
    [score],
  );

  return (
    <div className="mx-auto h-[110px] w-[210px]">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge
      />
    </div>
  );
}
