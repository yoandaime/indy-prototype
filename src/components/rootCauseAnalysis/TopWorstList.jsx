import { Button } from "@/components/ui/button";

// Horizontal "worst offender" rows — a two-line label, a proportional track
// bar, and a static "N days" value — used for Top Worst Table / Vendor / IP
// Source Issue lists.
export default function TopWorstList({
  title,
  period,
  rows,
  barColorClass,
  onSeeDetail,
}) {
  const maxDays = Math.max(...rows.map((r) => r.days), 1);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {period && (
          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
            {period}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No issues found
          </p>
        )}
        {rows.map((row, i) => (
          <div
            key={`${row.label}-${i}`}
            className="flex items-center gap-2 text-xs"
          >
            <div className="w-[88px] shrink-0 leading-tight">
              <p className="truncate font-medium text-foreground">
                {row.label}
              </p>
              {row.sub && (
                <p className="truncate text-[10px] text-muted-foreground">
                  {row.sub}
                </p>
              )}
            </div>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full ${barColorClass}`}
                style={{ width: `${Math.max(6, (row.days / maxDays) * 100)}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-muted-foreground">
              {row.days} days
            </span>
          </div>
        ))}
      </div>

      {onSeeDetail && rows.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onSeeDetail}
        >
          See Detail
        </Button>
      )}
    </div>
  );
}
