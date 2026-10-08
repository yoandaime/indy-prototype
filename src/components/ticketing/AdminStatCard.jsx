import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function AdminStatCard({ icon: Icon, label, value, iconClassName, valueClassName }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100", iconClassName)}>
          {Icon && <Icon className="size-4.5" />}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={cn("text-xl font-semibold text-foreground", valueClassName)}>{value}</span>
        </div>
      </CardContent>
    </Card>
  )
}
