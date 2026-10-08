import {
  ArrowDown,
  ArrowUp,
  Database,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const METRIC_ICONS = { completeness: Database, dqi: ShieldCheck };

const STATUS_STYLES = {
  Good: "bg-emerald-50 text-emerald-600",
  Average: "bg-amber-50 text-amber-600",
  Poor: "bg-red-50 text-red-600",
};

function ScoreItem({ metric }) {
  const Icon = METRIC_ICONS[metric.key] ?? Database;
  const down = metric.change < 0;
  const flat = metric.change === 0;
  const Arrow = down ? ArrowDown : ArrowUp;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-2">
      <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="size-[18px]" />
      </div>
      <p className="text-sm font-semibold text-muted-foreground">
        {metric.label}
      </p>
      <div className="flex items-center gap-2.5">
        <span className="text-2xl font-semibold text-foreground">
          {metric.value}%
        </span>
        <div
          className={`flex flex-col text-xs font-semibold leading-tight ${
            flat
              ? "text-muted-foreground"
              : down
                ? "text-red-600"
                : "text-emerald-600"
          }`}
        >
          <span className="flex items-center gap-0.5">
            {!flat && <Arrow className="size-3" />}
            {Math.abs(metric.change)}%
          </span>
          <span>Day-on-Day</span>
        </div>
      </div>
      <Badge variant="secondary" className={STATUS_STYLES[metric.status]}>
        {metric.status}
      </Badge>
    </div>
  );
}

export default function RcaScoreCard({ metrics, loading }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-foreground">Score Card</h2>
      <Card className="flex-1 shadow-sm">
        <CardContent className="flex flex-1 flex-col divide-y divide-neutral-100">
          {loading
            ? [0, 1].map((i) => (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center justify-center gap-1.5 py-2"
                >
                  <Skeleton className="size-9 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))
            : metrics.map((m) => <ScoreItem key={m.key} metric={m} />)}
        </CardContent>
      </Card>
    </div>
  );
}
