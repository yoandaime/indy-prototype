import { Skeleton } from "@/components/ui/skeleton";
import RcaGauge from "./RcaGauge";

function Stat({ label, value, pct }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">
        {value} <span className="text-emerald-600">{pct}%</span>
      </p>
    </div>
  );
}

// Stand-alone gauge tile (no outer section container): label, gauge, score,
// MoM directly beneath it, then pass stats. Used for each layer and the
// overall Score Card.
export default function RcaPerformanceCard({ title, perf, loading }) {
  if (loading) return <Skeleton className="h-[300px] w-full rounded-xl" />;

  return (
    <div className="flex h-full flex-col items-center gap-1 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="mt-4">
        <RcaGauge score={perf.score} />
      </div>
      <p className="mt-1 text-2xl font-semibold text-foreground">
        {perf.score}%
      </p>
      <p
        className={`text-xs font-medium ${perf.mom < 0 ? "text-red-600" : "text-emerald-600"}`}
      >
        {perf.mom > 0 ? "+" : ""}
        {perf.mom}% MoM
      </p>
      <div className="mt-3 grid w-full grid-cols-2 gap-2 border-t border-neutral-100 pt-3">
        <Stat
          label="Total Table Pass"
          value={perf.tablePass}
          pct={perf.tablePassPct}
        />
        <Stat
          label="Total KPI Pass"
          value={perf.kpiPass}
          pct={perf.kpiPassPct}
        />
      </div>
    </div>
  );
}
